mod imdb;
mod jikan;
mod scraper;
mod tmdb;



#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum AnimeSource {
    CurrentSeason,
    UpcomingSeason,
    TopAnime,
}

#[derive(sqlx::FromRow)]
#[allow(non_snake_case)]
struct IdTitleRow {
    id: String,
    title: String,
}

#[derive(sqlx::FromRow)]
struct MangaRow {
    id: String,
    title: String,
    #[sqlx(rename = "lastScrapedAt")]
    last_scraped_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(sqlx::FromRow)]
struct IdRow {
    id: String,
}

#[derive(sqlx::FromRow)]
struct ChannelScrapeRow {
    id: String,
    title: String,
    #[sqlx(rename = "embedUrl")]
    embed_url: Option<String>,
}


use anyhow::{Context, Result};
use clap::Parser;
use dotenvy::dotenv;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::env;
use std::str::FromStr;
use std::time::Duration;
use tokio::time::sleep;

use imdb::ImdbService;
use jikan::JikanService;
use tmdb::TmdbService;
use scraper::{
    AnimeScraper, ChannelScraper, MangaScraper, MovieScraper, NovelaScraper, SeriesScraper,
    utils::resolve_video_url,
};

fn slugify(text: &str) -> String {
    text.to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Run anime scraping
    #[arg(long)]
    anime: bool,

    /// Run series scraping
    #[arg(long, alias = "serie")]
    series: bool,

    /// Run movie scraping
    #[arg(long, alias = "filme")]
    movies: bool,

    /// Run manga scraping
    #[arg(long)]
    manga: bool,

    /// Run novela scraping
    #[arg(long)]
    novela: bool,

    /// Run channel scraping
    #[arg(long, alias = "canal")]
    channels: bool,
}



async fn fetch_and_traverse_prequeles(
    jikan: &JikanService,
    initial_mal_id: i32,
) -> Vec<jikan::JikanAnime> {
    let mut chain = Vec::new();
    let mut current_id = initial_mal_id;
    let mut visited = std::collections::HashSet::new();

    // 1. Traverse backwards (Prequels) to find root / Season 1
    loop {
        if !visited.insert(current_id) {
            break;
        }

        // Fetch anime details if we have current_id
        let anime_opt = match jikan.get_anime_by_id(current_id).await {
            Ok(opt) => opt,
            Err(e) => {
                eprintln!("[WARN] Error fetching anime details by mal_id {}: {}. Skipping item to avoid creating empty stub.", current_id, e);
                None
            }
        };

        let anime = match anime_opt {
            Some(a) => a,
            None => break,
        };

        chain.push(anime);

        // Sleep to respect rate limit
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        // Fetch relations
        let relations = match jikan.get_anime_relations(current_id).await {
            Ok(rels) => rels,
            Err(e) => {
                eprintln!("[WARN] Could not fetch relations for mal_id {}: {}.", current_id, e);
                break;
            }
        };

        // Find prequel relation of type "anime"
        let mut prequel_id = None;
        let mut prequel_title = None;
        for rel in relations {
            if rel.relation.to_lowercase() == "prequel" {
                for entry in rel.entry {
                    if entry.entry_type.to_lowercase() == "anime" {
                        prequel_id = Some(entry.mal_id);
                        prequel_title = Some(entry.name);
                        break;
                    }
                }
            }
            if prequel_id.is_some() {
                break;
            }
        }

        match prequel_id {
            Some(pid) => {
                println!("Found prequel mal_id {} ({}) for mal_id {}", pid, prequel_title.as_deref().unwrap_or(""), current_id);
                current_id = pid;
            }
            None => break, // Reached root / season 1
        }

        tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
    }

    // Reverse so season 1 (oldest prequel) comes first!
    chain.reverse();

    // 2. Traverse forwards (Sequels) from the latest item in chain
    if let Some(last_item) = chain.last().cloned() {
        if let Some(mut current_sequel_id) = last_item.mal_id {
            loop {
                tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
                let relations = match jikan.get_anime_relations(current_sequel_id).await {
                    Ok(rels) => rels,
                    Err(_) => break,
                };

                let mut sequel_id = None;
                for rel in relations {
                    if rel.relation.to_lowercase() == "sequel" {
                        for entry in rel.entry {
                            if entry.entry_type.to_lowercase() == "anime" {
                                sequel_id = Some(entry.mal_id);
                                break;
                            }
                        }
                    }
                    if sequel_id.is_some() {
                        break;
                    }
                }

                match sequel_id {
                    Some(sid) => {
                        if !visited.insert(sid) {
                            break;
                        }
                        println!("Found sequel mal_id {} for mal_id {}", sid, current_sequel_id);
                        if let Ok(Some(seq_anime)) = jikan.get_anime_by_id(sid).await {
                            chain.push(seq_anime);
                            current_sequel_id = sid;
                        } else {
                            break;
                        }
                    }
                    None => break,
                }
            }
        }
    }

    chain
}

async fn process_anime_item(
    pool: &sqlx::PgPool,
    anime_scraper: &AnimeScraper,
    anime: &jikan::JikanAnime,
    override_season_number: Option<i32>,
    override_parent_title: Option<String>,
) -> Result<()> {
    let description = anime.synopsis.clone();
    let image_url = anime.get_image_url();
    let genres: Vec<String> = anime
        .genres
        .clone()
        .unwrap_or_default()
        .into_iter()
        .map(|g| g.name)
        .collect();
    let default_title = anime.get_default_title();
    let english_title = anime.get_english_title();
    let parent_english_title = english_title.as_ref().map(|eng| {
        let (cleaned_eng, _, _) = scraper::utils::parse_anime_title(eng);
        cleaned_eng
    });

    let (parsed_parent_title, parsed_season_number, _part_number) = scraper::utils::parse_anime_title(&default_title);
    let parent_title = override_parent_title.unwrap_or(parsed_parent_title);
    let season_number = override_season_number.unwrap_or(parsed_season_number);
    let parent_slug = slugify(&parent_title);

    if (parent_title.starts_with("Anime ") || parent_slug.starts_with("anime-")) && image_url.is_none() && description.is_none() {
        println!("[WARN] Skipping DB save for incomplete stub anime: {} ({})", parent_title, parent_slug);
        return Ok(());
    }
    let aired = anime.aired.as_ref().and_then(|a| a.string.clone());
    let rating = anime.rating.clone();
    let status = anime.status.clone();
    let duration = anime.duration.clone();
    let season = anime.season.clone();
    let year = anime.year;
    let broadcast_day = anime.broadcast.as_ref().and_then(|b| b.day.clone());
    let broadcast_time = anime.broadcast.as_ref().and_then(|b| b.time.clone());
    let broadcast_timezone = anime.broadcast.as_ref().and_then(|b| b.timezone.clone());
    let broadcast_string = anime.broadcast.as_ref().and_then(|b| b.string.clone());

    let default_audio = vec!["Japanese".to_string()];
    let default_subtitles = vec!["Português (Brasil)".to_string()];

    let existing = sqlx::query_as::<_, IdRow>(r#"SELECT id FROM "Anime" WHERE slug = $1"#)
        .bind(&parent_slug)
        .fetch_optional(pool)
        .await;

    let parent_id = match existing {
        Ok(Some(row)) => {
            let _ = sqlx::query(
                r#"
                UPDATE "Anime"
                SET rank = COALESCE($1, rank),
                    popularity = COALESCE($2, popularity),
                    members = COALESCE($3, members),
                    score = COALESCE($4, score),
                    "titleEnglish" = COALESCE("titleEnglish", $5),
                    "broadcastDay" = COALESCE("broadcastDay", $6),
                    "broadcastTime" = COALESCE("broadcastTime", $7),
                    "broadcastTimezone" = COALESCE("broadcastTimezone", $8),
                    "broadcastString" = COALESCE("broadcastString", $9),
                    "updatedAt" = NOW()
                WHERE id = $10
                "#,
            )
            .bind(&(anime.rank))
            .bind(&(anime.popularity))
            .bind(&(anime.members))
            .bind(&(anime.score))
            .bind(&parent_english_title)
            .bind(&broadcast_day)
            .bind(&broadcast_time)
            .bind(&broadcast_timezone)
            .bind(&broadcast_string)
            .bind(&row.id)
            .execute(pool)
            .await;
            row.id
        }
        _ => {
            let new_id = uuid::Uuid::new_v4().to_string();
            match sqlx::query(
                r#"
                INSERT INTO "Anime" (id, slug, title, "titleEnglish", description, "imageUrl", genres, audio, subtitles, aired, rating, score, status, duration, season, year, "broadcastDay", "broadcastTime", "broadcastTimezone", "broadcastString", rank, popularity, members, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW())
                ON CONFLICT (slug) DO UPDATE 
                SET title = COALESCE("Anime".title, EXCLUDED.title),
                    "titleEnglish" = COALESCE("Anime"."titleEnglish", EXCLUDED."titleEnglish"),
                    description = COALESCE("Anime".description, EXCLUDED.description),
                    "imageUrl" = COALESCE("Anime"."imageUrl", EXCLUDED."imageUrl"),
                    genres = EXCLUDED.genres,
                    audio = COALESCE("Anime".audio, EXCLUDED.audio),
                    subtitles = COALESCE("Anime".subtitles, EXCLUDED.subtitles),
                    aired = COALESCE("Anime".aired, EXCLUDED.aired),
                    rating = COALESCE("Anime".rating, EXCLUDED.rating),
                    score = COALESCE("Anime".score, EXCLUDED.score),
                    status = COALESCE("Anime".status, EXCLUDED.status),
                    duration = COALESCE("Anime".duration, EXCLUDED.duration),
                    season = COALESCE("Anime".season, EXCLUDED.season),
                    year = COALESCE("Anime".year, EXCLUDED.year),
                    "broadcastDay" = COALESCE("Anime"."broadcastDay", EXCLUDED."broadcastDay"),
                    "broadcastTime" = COALESCE("Anime"."broadcastTime", EXCLUDED."broadcastTime"),
                    "broadcastTimezone" = COALESCE("Anime"."broadcastTimezone", EXCLUDED."broadcastTimezone"),
                    "broadcastString" = COALESCE("Anime"."broadcastString", EXCLUDED."broadcastString"),
                    rank = EXCLUDED.rank,
                    popularity = EXCLUDED.popularity,
                    members = EXCLUDED.members,
                    "updatedAt" = NOW()
                "#,
            )
            .bind(&new_id)
            .bind(&parent_slug)
            .bind(&parent_title)
            .bind(&parent_english_title)
            .bind(&description)
            .bind(&image_url)
            .bind(&genres)
            .bind(&default_audio)
            .bind(&default_subtitles)
            .bind(&aired)
            .bind(&rating)
            .bind(&anime.score)
            .bind(&status)
            .bind(&duration)
            .bind(&season)
            .bind(&year)
            .bind(&broadcast_day)
            .bind(&broadcast_time)
            .bind(&broadcast_timezone)
            .bind(&broadcast_string)
            .bind(&anime.rank)
            .bind(&anime.popularity)
            .bind(&anime.members)
            .execute(pool)
            .await
            {
                Ok(_) => new_id,
                Err(e) => {
                    eprintln!("Error inserting parent anime {}: {}", parent_title, e);
                    return Err(e.into());
                }
            }
        }
    };

    let cleaned_title = scraper::utils::clean_part_suffix(&default_title);
    let season_title = if cleaned_title != parent_title {
        Some(cleaned_title)
    } else {
        None
    };

    // Ensure Season row exists for this season_number under parent_id
    let _ = sqlx::query(
        r#"
        INSERT INTO "Season" (id, number, title, "animeId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT ("animeId", number) DO UPDATE SET 
        title = CASE
            WHEN EXCLUDED.title IS NULL THEN "Season".title
            WHEN "Season".title IS NOT NULL 
                 AND "Season".title NOT ILIKE '%Part%' 
                 AND "Season".title NOT ILIKE '%Cour%' 
                 AND "Season".title NOT ILIKE '% - %' THEN "Season".title
            ELSE EXCLUDED.title
        END,
        "updatedAt" = NOW()
        "#,
    )
    .bind(&(uuid::Uuid::new_v4().to_string()))
    .bind(&season_number)
    .bind(&season_title)
    .bind(&parent_id)
    .execute(pool)
    .await;

    // Scrape episodes immediately ("vai atras dos episodios")
    println!("Scraping episodes for anime (season {}): {}", season_number, parent_title);
    match anime_scraper.scrape(&default_title).await.or(anime_scraper.scrape(&parent_title).await) {
        Ok(Some(scraped_data)) => {
            println!("Found {} episodes for {}", scraped_data.episodes.len(), default_title);
            let final_image_url = image_url.clone().or(scraped_data.image_url.clone());
            for ep in scraped_data.episodes {
                let ep_season_number = if ep.season_number == 1 && season_number > 1 {
                    season_number
                } else {
                    ep.season_number
                };

                let season_id: String = match sqlx::query_as::<_, IdRow>(
                    r#"
                    INSERT INTO "Season" (id, number, title, "animeId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    ON CONFLICT ("animeId", number) DO UPDATE SET 
                    title = CASE
                        WHEN EXCLUDED.title IS NULL THEN "Season".title
                        WHEN "Season".title IS NOT NULL 
                             AND "Season".title NOT ILIKE '%Part%' 
                             AND "Season".title NOT ILIKE '%Cour%' 
                             AND "Season".title NOT ILIKE '% - %' THEN "Season".title
                        ELSE EXCLUDED.title
                    END,
                    "updatedAt" = NOW()
                    RETURNING id
                    "#,
                )
                .bind(&(uuid::Uuid::new_v4().to_string()))
                .bind(&ep_season_number)
                .bind(&season_title)
                .bind(&parent_id)
                .fetch_optional(pool)
                .await
                {
                    Ok(Some(row)) => row.id,
                    _ => match sqlx::query_as::<_, IdRow>(
                        r#"SELECT id FROM "Season" WHERE "animeId" = $1 AND number = $2"#,
                    )
                    .bind(&parent_id)
                    .bind(&ep_season_number)
                    .fetch_optional(pool)
                    .await
                    {
                        Ok(Some(row)) => row.id,
                        _ => {
                            eprintln!(
                                "Failed to get/insert season row for anime {} season {}",
                                parent_title, ep_season_number
                            );
                            continue;
                        }
                    },
                };

                let ep_image = ep.image_url.or(final_image_url.clone());
                let _ = sqlx::query(
                    r#"
                    INSERT INTO "Episode" (id, number, title, "videoUrl", "imageUrl", "seasonId", "createdAt", "updatedAt")
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    ON CONFLICT ("seasonId", number) DO UPDATE 
                    SET "videoUrl" = EXCLUDED."videoUrl", 
                        title = EXCLUDED.title, 
                        "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Episode"."imageUrl"),
                        "updatedAt" = NOW()
                    "#,
                )
                .bind(&(uuid::Uuid::new_v4().to_string()))
                .bind(&(ep.number))
                .bind(&(ep.title))
                .bind(&(ep.url))
                .bind(&(ep_image))
                .bind(&(season_id))
                .execute(pool)
                .await;
            }

            let _ = sqlx::query(
                r#"
                UPDATE "Anime" 
                SET "lastScrapedAt" = NOW(), 
                    "imageUrl" = COALESCE($1, "imageUrl"),
                    "updatedAt" = NOW()
                WHERE id = $2
                "#,
            )
            .bind(&final_image_url)
            .bind(&parent_id)
            .execute(pool)
            .await;
        }
        _ => {
            let _ = sqlx::query(
                r#"
                UPDATE "Anime" 
                SET "lastScrapedAt" = NOW(), 
                    "updatedAt" = NOW()
                WHERE id = $1
                "#,
            )
            .bind(&parent_id)
            .execute(pool)
            .await;
            println!("No episodes found/failed scraping for anime: {}", parent_title);
        }
    }

    Ok(())
}


#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    let args = Args::parse();

    // If no flags are provided, run all by default
    let run_all = !args.anime
        && !args.series
        && !args.movies
        && !args.manga
        && !args.novela
        && !args.channels;
    let do_anime = args.anime || run_all;
    let do_series = args.series || run_all;
    let do_movies = args.movies || run_all;
    let do_manga = args.manga || run_all;
    let do_novela = args.novela || run_all;
    let do_channels = args.channels || run_all;

    let database_url = env::var("DIRECT_URL")
        .or_else(|_| env::var("DATABASE_URL"))
        .expect("Neither DIRECT_URL nor DATABASE_URL is set");

    let connect_options = PgConnectOptions::from_str(&database_url)?.statement_cache_capacity(0);

    let pool = PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(30))
        .connect_with(connect_options)
        .await?;

    if do_manga {
        let _ = sqlx::query(r#"UPDATE "Manga" SET "lastScrapedAt" = NULL"#)
            .execute(&pool)
            .await;
    }

    let anime_scraper = AnimeScraper::new();
    let series_scraper = SeriesScraper::new();
    let movie_scraper = MovieScraper::new();
    let manga_scraper = MangaScraper::new();
    let novela_scraper = NovelaScraper::new();
    let channel_scraper = ChannelScraper::new();
    let jikan = JikanService::new();
    let imdb = ImdbService::new();
    let tmdb = TmdbService::new();

    println!("Worker started (Anime: {}, Series: {}, Movies: {}, Manga: {}, Novelas: {}, Channels: {}), polling...", 
        do_anime, do_series, do_movies, do_manga, do_novela, do_channels);

    // Clean up any incomplete dummy stubs from the database
    let cleanup_res = sqlx::query(
        r#"DELETE FROM "Anime" WHERE (slug LIKE 'anime-%' OR title LIKE 'Anime %') AND "imageUrl" IS NULL AND description IS NULL"#
    )
    .execute(&pool)
    .await;
    if let Ok(deleted) = cleanup_res {
        if deleted.rows_affected() > 0 {
            println!("[CLEANUP] Deleted {} incomplete dummy anime stubs from database", deleted.rows_affected());
        }
    }

    let mut anime_source = AnimeSource::CurrentSeason;
    let mut anime_page = 1;
    let mut discovery_counter = 0;

    loop {
        // 1. Discover new anime and scrape their episodes (runs on every iteration if do_anime is enabled)
        if do_anime {
            println!("Discovering new animes from Jikan (source: {:?}, page: {})...", anime_source, anime_page);
            let fetch_res = match anime_source {
                AnimeSource::CurrentSeason => jikan.get_current_season_anime(anime_page).await,
                AnimeSource::UpcomingSeason => jikan.get_upcoming_season_anime(anime_page).await,
                AnimeSource::TopAnime => jikan.get_top_anime(anime_page).await,
            };
            match fetch_res {
                Ok((top_animes, pagination_opt)) => {
                    let is_empty = top_animes.is_empty();
                    for anime in top_animes {
                        if let Some(mal_id) = anime.mal_id {
                            println!("Traversing prequel franchise chain for anime: {} (mal_id: {})", anime.title, mal_id);
                            let chain = fetch_and_traverse_prequeles(&jikan, mal_id).await;
                            println!("Franchise chain length for {}: {}", anime.title, chain.len());

                            let root_parent_title = chain.first().map(|item| {
                                let (parsed, _, _) = scraper::utils::parse_anime_title(&item.get_default_title());
                                parsed
                            });

                            let mut current_tv_season = 1;
                            let mut has_seen_tv = false;
                            for item in &chain {
                                let type_str = item.type_name.as_deref().unwrap_or("TV").to_uppercase();
                                let is_tv = type_str == "TV";
                                let default_title = item.get_default_title();
                                let (_, parsed_season_number, part_number) = scraper::utils::parse_anime_title(&default_title);

                                let season_num = if is_tv {
                                    if parsed_season_number > 1 {
                                        current_tv_season = parsed_season_number;
                                        has_seen_tv = true;
                                        current_tv_season
                                    } else if part_number.is_some() {
                                        if !has_seen_tv {
                                            has_seen_tv = true;
                                            current_tv_season = 1;
                                        }
                                        current_tv_season
                                    } else {
                                        if has_seen_tv {
                                            current_tv_season += 1;
                                        } else {
                                            has_seen_tv = true;
                                            current_tv_season = 1;
                                        }
                                        current_tv_season
                                    }
                                } else {
                                    0 // Season 0 for Movies / OVAs / Specials
                                };

                                println!(
                                    "Processing franchise item ({:?}, Season {}): {}",
                                    item.type_name, season_num, item.title
                                );
                                if let Err(e) = process_anime_item(&pool, &anime_scraper, item, Some(season_num), root_parent_title.clone()).await {
                                    eprintln!("Error processing anime item {}: {}", item.title, e);
                                }
                                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                            }
                        } else {
                            if let Err(e) = process_anime_item(&pool, &anime_scraper, &anime, None, None).await {
                                eprintln!("Error processing anime item {}: {}", anime.title, e);
                            }
                            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
                        }
                    }

                    // Check pagination to proceed to next page or transition source
                    let mut has_next = false;
                    if let Some(pagination) = pagination_opt {
                        println!("Pagination: current_page = {}, last_visible_page = {}, has_next_page = {}",
                            pagination.current_page, pagination.last_visible_page, pagination.has_next_page);
                        has_next = pagination.has_next_page && pagination.current_page < pagination.last_visible_page;
                    }

                    if !has_next || is_empty {
                        match anime_source {
                            AnimeSource::CurrentSeason => {
                                println!("Finished current season. Transitioning to upcoming season.");
                                anime_source = AnimeSource::UpcomingSeason;
                                anime_page = 1;
                            }
                            AnimeSource::UpcomingSeason => {
                                println!("Finished upcoming season. Transitioning to top anime.");
                                anime_source = AnimeSource::TopAnime;
                                anime_page = 1;
                            }
                            AnimeSource::TopAnime => {
                                println!("Finished top anime page. Transitioning back to current season.");
                                anime_source = AnimeSource::CurrentSeason;
                                anime_page = 1;
                            }
                        }
                    } else {
                        anime_page += 1;
                    }
                }
                Err(e) => {
                    eprintln!("Error discovering animes: {}", e);
                    // Sleep a bit on error to avoid spamming calls
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }

        // 1b. Periodically discover other content
        if discovery_counter % 10 == 0 {

            if do_series {
                println!("Discovering new popular series from TMDB...");
                let page = ((discovery_counter / 10) + 1) as i32;
                match tmdb.get_popular_series(page).await {
                    Ok(popular_series) => {
                        for show in popular_series {
                            let description = show.overview.clone();
                            let image_url = show.get_image_url();
                            let genres: Vec<String> = Vec::new();
                            let slug = slugify(&show.name);
                            let tmdb_id_str = Some(show.id.to_string());
                            if let Err(e) = sqlx::query(
                                r#"
                                INSERT INTO "Series" (id, slug, title, description, "imageUrl", genres, "tmdbId", "createdAt", "updatedAt")
                                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                                ON CONFLICT (slug) DO UPDATE 
                                SET description = COALESCE("Series".description, EXCLUDED.description),
                                    "imageUrl" = COALESCE("Series"."imageUrl", EXCLUDED."imageUrl"),
                                    "tmdbId" = COALESCE("Series"."tmdbId", EXCLUDED."tmdbId"),
                                    "updatedAt" = NOW()
                                "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(slug)).bind(&(show.name)).bind(&(description)).bind(&(image_url)).bind(&genres).bind(&tmdb_id_str)
                            .execute(&pool)
                            .await {
                                eprintln!("Error inserting series from TMDB {}: {}", show.name, e);
                            }
                        }
                    }
                    Err(e) => eprintln!("Error discovering popular series from TMDB: {}", e),
                }

                println!("Discovering new popular series from TVMaze...");
                match imdb.get_popular_series().await {
                    Ok(top_series) => {
                        for show in top_series {
                            let description = show.get_description();
                            let image_url = show.get_image_url();
                            let genres = show.genres.unwrap_or_default();
                            let slug = slugify(&show.name);
                            if let Err(e) = sqlx::query(
                                r#"
                                INSERT INTO "Series" (id, slug, title, description, "imageUrl", genres, "createdAt", "updatedAt")
                                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                                ON CONFLICT (slug) DO UPDATE 
                                SET description = COALESCE("Series".description, EXCLUDED.description),
                                    "imageUrl" = COALESCE("Series"."imageUrl", EXCLUDED."imageUrl"),
                                    genres = EXCLUDED.genres,
                                    "updatedAt" = NOW()
                                "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(slug)).bind(&(show.name)).bind(&(description)).bind(&(image_url)).bind(&genres)
                            .execute(&pool)
                            .await {
                                eprintln!("Error inserting series from TVMaze {}: {}", show.name, e);
                            }
                        }
                    }
                    Err(e) => eprintln!("Error discovering series from TVMaze: {}", e),
                }
            }

            if do_movies {
                println!("Discovering new popular movies from TMDB...");
                let page = ((discovery_counter / 10) + 1) as i32;
                match tmdb.get_popular_movies(page).await {
                    Ok(popular_movies) => {
                        for item in popular_movies {
                            let slug = slugify(&item.title);
                            let description = item.overview.clone();
                            let image_url = item.get_image_url();
                            let tmdb_id = Some(item.id.to_string());
                            if let Err(e) = sqlx::query(
                                r#"
                                INSERT INTO "Movie" (id, slug, title, "imageUrl", description, "tmdbId", "createdAt", "updatedAt")
                                VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                                ON CONFLICT (slug) DO UPDATE 
                                SET "imageUrl" = COALESCE("Movie"."imageUrl", EXCLUDED."imageUrl"),
                                    description = COALESCE("Movie".description, EXCLUDED.description),
                                    "tmdbId" = COALESCE("Movie"."tmdbId", EXCLUDED."tmdbId"),
                                    "updatedAt" = NOW()
                                "#)
                            .bind(&(uuid::Uuid::new_v4().to_string()))
                            .bind(&slug)
                            .bind(&item.title)
                            .bind(&image_url)
                            .bind(&description)
                            .bind(&tmdb_id)
                            .execute(&pool)
                            .await {
                                eprintln!("Error inserting movie {}: {}", item.title, e);
                            }
                        }
                    }
                    Err(e) => eprintln!("Error discovering popular movies: {}", e),
                }
            }

            if do_manga {
                println!("Discovering new popular manga from Jikan...");
                let page = (discovery_counter / 10) + 1;
                match jikan.get_top_manga(page).await {
                    Ok(top_manga) => {
                        for manga in top_manga {
                            let description = manga.synopsis.clone();
                            let image_url = manga.get_image_url();
                            let slug = slugify(&manga.title);
                            let aired = manga.get_aired();
                            let rating = manga.get_rating();
                            let status = manga.status.clone();
                            let genres: Vec<String> = manga
                                .genres
                                .unwrap_or_default()
                                .into_iter()
                                .map(|g| g.name)
                                .collect();
                            if let Err(e) = sqlx::query(
                                r#"
                                INSERT INTO "Manga" (id, slug, title, description, "imageUrl", genres, aired, rating, status, "createdAt", "updatedAt")
                                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                                ON CONFLICT (slug) DO UPDATE 
                                SET description = COALESCE("Manga".description, EXCLUDED.description),
                                    "imageUrl" = COALESCE("Manga"."imageUrl", EXCLUDED."imageUrl"),
                                    genres = EXCLUDED.genres,
                                    aired = COALESCE("Manga".aired, EXCLUDED.aired),
                                    rating = COALESCE("Manga".rating, EXCLUDED.rating),
                                    status = COALESCE("Manga".status, EXCLUDED.status),
                                    "updatedAt" = NOW()
                                "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(slug)).bind(&(manga.title)).bind(&(description)).bind(&(image_url)).bind(&genres).bind(&(aired)).bind(&(rating)).bind(&(status))
                            .execute(&pool)
                            .await {
                                eprintln!("Error inserting manga {}: {}", manga.title, e);
                            }
                        }
                    }
                    Err(e) => eprintln!("Error discovering manga: {}", e),
                }
            }

            if do_novela {
                println!("Discovering new novelas from novela sites...");
                match novela_scraper.get_latest_novelas().await {
                    Ok(latest_novelas) => {
                        for item in latest_novelas {
                            let slug = slugify(&item.title);
                            if let Err(e) = sqlx::query(
                                r#"
                                INSERT INTO "Novela" (id, slug, title, "imageUrl", "createdAt", "updatedAt")
                                VALUES ($1, $2, $3, $4, NOW(), NOW())
                                ON CONFLICT (slug) DO UPDATE 
                                SET "imageUrl" = COALESCE("Novela"."imageUrl", EXCLUDED."imageUrl"),
                                    "updatedAt" = NOW()
                                "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(slug)).bind(&(item.title)).bind(&(item.image_url))
                            .execute(&pool)
                            .await {
                                eprintln!("Error inserting novela {}: {}", item.title, e);
                            }
                        }
                    }
                    Err(e) => eprintln!("Error discovering novelas: {}", e),
                }
            }

            if do_channels {
                println!("Discovering famous channels...");
                let famous_channels = vec!["Globo", "SBT", "Record"];
                for title in famous_channels {
                    let slug = slugify(title);
                    if let Err(e) = sqlx::query(
                        r#"
                        INSERT INTO "Channel" (id, slug, title, "createdAt", "updatedAt")
                        VALUES ($1, $2, $3, NOW(), NOW())
                        ON CONFLICT (title) DO NOTHING
                        "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(slug)).bind(&(title))
                    .execute(&pool)
                    .await {
                        eprintln!("Error inserting channel {}: {}", title, e);
                    }
                }
            }
        }
        discovery_counter += 1;

        // 2. Fetch animes that need scraping
        if do_anime {
            let animes = sqlx::query_as::<_, IdTitleRow>(
                r#"
                SELECT id, title 
                FROM "Anime" 
                WHERE "lastScrapedAt" IS NULL 
                   OR "lastScrapedAt" < NOW() - INTERVAL '24 hours'
                ORDER BY "lastScrapedAt" ASC NULLS FIRST
                LIMIT 3
                "#)
            .fetch_all(&pool)
            .await?;

            for anime in animes {
                println!("Scraping anime: {}", anime.title);

                let default_audio = vec![
                    "Japanese".to_string(),
                ];
                let default_subtitles = vec![
                    "Português (Brasil)".to_string(),
                ];

                // Fetch cover and description from Jikan API
                let mut jikan_image_url = None;
                let mut jikan_description = None;
                let mut jikan_genres = None;
                let mut jikan_aired = None;
                let mut jikan_rating = None;
                let mut jikan_score = None;
                let mut jikan_status = None;
                let mut jikan_duration = None;
                let mut jikan_rank = None;
                let mut jikan_popularity = None;
                let mut jikan_members = None;
                let mut jikan_english_title = None;
                let mut jikan_mal_id = None;
                match jikan.search_anime(&anime.title).await {
                    Ok(Some(j_anime)) => {
                        jikan_english_title = j_anime.get_english_title().map(|eng| {
                            let (cleaned_eng, _, _) = scraper::utils::parse_anime_title(&eng);
                            cleaned_eng
                        });
                        jikan_mal_id = j_anime.mal_id;
                        jikan_image_url = j_anime.get_image_url();
                        jikan_description = j_anime.synopsis;
                        jikan_genres = Some(
                            j_anime
                                .genres
                                .unwrap_or_default()
                                .into_iter()
                                .map(|g| g.name)
                                .collect::<Vec<_>>(),
                        );
                        jikan_aired = j_anime.aired.and_then(|a| a.string);
                        jikan_rating = j_anime.rating;
                        jikan_score = j_anime.score;
                        jikan_status = j_anime.status;
                        jikan_duration = j_anime.duration;
                        jikan_rank = j_anime.rank;
                        jikan_popularity = j_anime.popularity;
                        jikan_members = j_anime.members;
                        println!("Found details on Jikan for anime: {}", anime.title);
                    }
                    Ok(None) => println!("No details found on Jikan for anime: {}", anime.title),
                    Err(e) => eprintln!("Error searching Jikan for anime {}: {}", anime.title, e),
                }
                // Sleep to avoid rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                if let Ok(Some(scraped_data)) = anime_scraper.scrape(&anime.title).await {
                    println!(
                        "Found {} episodes for {}",
                        scraped_data.episodes.len(),
                        anime.title
                    );
                    let final_image_url = jikan_image_url.or(scraped_data.image_url.clone());
                    for ep in scraped_data.episodes {
                        let season_id: String = match sqlx::query_as::<_, IdRow>(
                            r#"
                            INSERT INTO "Season" (id, number, "animeId", "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, NOW(), NOW())
                            ON CONFLICT ("animeId", number) DO UPDATE SET "updatedAt" = NOW()
                            RETURNING id
                            "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(ep.season_number)).bind(&(anime.id))
                        .fetch_optional(&pool)
                        .await?
                        {
                            Some(row) => row.id,
                            None => sqlx::query_as::<_, IdRow>(
                                r#"SELECT id FROM "Season" WHERE "animeId" = $1 AND number = $2"#).bind(&(anime.id)).bind(&(ep.season_number))
                            .fetch_optional(&pool)
                            .await?
                            .map(|row| row.id)
                            .context(format!(
                                "season row missing after insert for anime '{}' season {}",
                                anime.title, ep.season_number
                            ))?,
                        };

                        let ep_image = ep.image_url.or(final_image_url.clone());

                        let _ = sqlx::query(
                            r#"
                            INSERT INTO "Episode" (id, "publicId", number, title, "videoUrl", "imageUrl", "seasonId", "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                            ON CONFLICT ("seasonId", number) DO UPDATE 
                            SET "videoUrl" = EXCLUDED."videoUrl", 
                                title = EXCLUDED.title, 
                                "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Episode"."imageUrl"),
                                "publicId" = COALESCE("Episode"."publicId", EXCLUDED."publicId"),
                                "updatedAt" = NOW()
                            "#)
                        .bind(&(uuid::Uuid::new_v4().to_string()))
                        .bind(&(uuid::Uuid::new_v4().to_string()))
                        .bind(&(ep.number))
                        .bind(&(ep.title))
                        .bind(&(ep.url))
                        .bind(&(ep_image))
                        .bind(&(season_id))
                        .execute(&pool)
                        .await;
                    }

                    let _ = sqlx::query(
                        r#"
                        UPDATE "Anime" 
                        SET "lastScrapedAt" = NOW(), 
                            "imageUrl" = COALESCE($1, "imageUrl"), 
                            description = COALESCE($2, description),
                            genres = COALESCE($3, genres),
                            aired = COALESCE($4, aired),
                            rating = COALESCE($5, rating),
                            status = COALESCE($6, status),
                            duration = COALESCE($7, duration),
                            rank = COALESCE($8, rank),
                            popularity = COALESCE($9, popularity),
                            members = COALESCE($10, members),
                            score = COALESCE($11, score),
                            "titleEnglish" = COALESCE("titleEnglish", $12),
                            "malId" = COALESCE("malId", $13),
                            audio = CASE WHEN audio = '{}' OR audio IS NULL OR cardinality(audio) = 0 THEN $14 ELSE audio END,
                            subtitles = CASE WHEN subtitles = '{}' OR subtitles IS NULL OR cardinality(subtitles) = 0 THEN $15 ELSE subtitles END,
                            "updatedAt" = NOW()
                        WHERE id = $16
                        "#)
                    .bind(&(final_image_url))
                    .bind(&(jikan_description))
                    .bind(&(jikan_genres))
                    .bind(&(jikan_aired))
                    .bind(&(jikan_rating))
                    .bind(&(jikan_status))
                    .bind(&(jikan_duration))
                    .bind(&(jikan_rank))
                    .bind(&(jikan_popularity))
                    .bind(&(jikan_members))
                    .bind(&(jikan_score))
                    .bind(&(jikan_english_title))
                    .bind(&(jikan_mal_id))
                    .bind(&(default_audio))
                    .bind(&(default_subtitles))
                    .bind(&(anime.id))
                    .execute(&pool)
                    .await;
                } else {
                    // Update metadata even if video/episode scraping failed
                    let _ = sqlx::query(
                        r#"
                        UPDATE "Anime" 
                        SET "lastScrapedAt" = NOW(), 
                            "imageUrl" = COALESCE($1, "imageUrl"), 
                            description = COALESCE($2, description),
                            genres = COALESCE($3, genres),
                            aired = COALESCE($4, aired),
                            rating = COALESCE($5, rating),
                            status = COALESCE($6, status),
                            duration = COALESCE($7, duration),
                            rank = COALESCE($8, rank),
                            popularity = COALESCE($9, popularity),
                            members = COALESCE($10, members),
                            score = COALESCE($11, score),
                            "titleEnglish" = COALESCE("titleEnglish", $12),
                            "malId" = COALESCE("malId", $13),
                            audio = CASE WHEN audio = '{}' OR audio IS NULL OR cardinality(audio) = 0 THEN $14 ELSE audio END,
                            subtitles = CASE WHEN subtitles = '{}' OR subtitles IS NULL OR cardinality(subtitles) = 0 THEN $15 ELSE subtitles END,
                            "updatedAt" = NOW()
                        WHERE id = $16
                        "#)
                    .bind(&(jikan_image_url))
                    .bind(&(jikan_description))
                    .bind(&(jikan_genres))
                    .bind(&(jikan_aired))
                    .bind(&(jikan_rating))
                    .bind(&(jikan_status))
                    .bind(&(jikan_duration))
                    .bind(&(jikan_rank))
                    .bind(&(jikan_popularity))
                    .bind(&(jikan_members))
                    .bind(&(jikan_score))
                    .bind(&(jikan_english_title))
                    .bind(&(jikan_mal_id))
                    .bind(&(default_audio))
                    .bind(&(default_subtitles))
                    .bind(&(anime.id))
                    .execute(&pool)
                    .await;
                }
            }
        }

        // 3. Fetch series that need scraping
        if do_series {
            let series_list = sqlx::query_as::<_, IdTitleRow>(
                r#"
                SELECT id, title 
                FROM "Series" 
                WHERE "lastScrapedAt" IS NULL 
                   OR "lastScrapedAt" < NOW() - INTERVAL '24 hours'
                ORDER BY "lastScrapedAt" ASC NULLS FIRST
                LIMIT 3
                "#)
            .fetch_all(&pool)
            .await?;

            for series in series_list {
                println!("Scraping series: {}", series.title);

                // Fetch cover and description from TVMaze API
                let mut tvmaze_image_url = None;
                let mut tvmaze_description = None;
                let mut tvmaze_genres = None;
                match imdb.search_series(&series.title).await {
                    Ok(Some(show)) => {
                        tvmaze_image_url = show.get_image_url();
                        tvmaze_description = show.get_description();
                        tvmaze_genres = show.genres;
                        println!("Found details on TVMaze for series: {}", series.title);
                    }
                    Ok(None) => println!("No details found on TVMaze for series: {}", series.title),
                    Err(e) => {
                        eprintln!("Error searching TVMaze for series {}: {}", series.title, e)
                    }
                }
                // Sleep to avoid rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                // Fetch rating and year from TMDB API
                let mut tmdb_rating = None;
                let mut tmdb_year = None;
                let mut tmdb_id_str = None;
                match tmdb.search_series(&series.title).await {
                    Ok(Some(tmdb_series)) => {
                        tmdb_rating = tmdb_series.get_rating();
                        tmdb_year = tmdb_series.get_year();
                        tmdb_id_str = Some(tmdb_series.id.to_string());
                        println!("Found details on TMDB for series: {} -> Rating: {:?}, Year: {:?}", series.title, tmdb_rating, tmdb_year);

                        // Insert placeholder seasons and episodes from TMDB so that they are navigable on the frontend
                        if let Some(ref tmdb_seasons) = tmdb_series.seasons {
                            for season in tmdb_seasons {
                                // Skip specials/season 0
                                if season.season_number == 0 {
                                    continue;
                                }

                                // 1. Ensure Season exists
                                let season_id: String = match sqlx::query_as::<_, IdRow>(
                                    r#"
                                    INSERT INTO "SeriesSeason" (id, number, "seriesId", "createdAt", "updatedAt")
                                    VALUES ($1, $2, $3, NOW(), NOW())
                                    ON CONFLICT ("seriesId", number) DO UPDATE SET "updatedAt" = NOW()
                                    RETURNING id
                                    "#)
                                .bind(&(uuid::Uuid::new_v4().to_string()))
                                .bind(&season.season_number)
                                .bind(&series.id)
                                .fetch_optional(&pool)
                                .await {
                                    Ok(Some(row)) => row.id,
                                    _ => {
                                        match sqlx::query_as::<_, IdRow>(
                                            r#"SELECT id FROM "SeriesSeason" WHERE "seriesId" = $1 AND number = $2"#)
                                        .bind(&series.id)
                                        .bind(&season.season_number)
                                        .fetch_optional(&pool)
                                        .await {
                                            Ok(Some(row)) => row.id,
                                            _ => continue,
                                        }
                                    }
                                };

                                // 2. Insert placeholders for all episodes in this season
                                for ep_num in 1..=season.episode_count {
                                    let ep_title = format!("Episódio {}", ep_num);
                                    let _ = sqlx::query(
                                        r#"
                                        INSERT INTO "SeriesEpisode" (id, number, title, "videoUrl", "seasonId", "createdAt", "updatedAt")
                                        VALUES ($1, $2, $3, NULL, $4, NOW(), NOW())
                                        ON CONFLICT ("seasonId", number) DO NOTHING
                                        "#)
                                    .bind(&(uuid::Uuid::new_v4().to_string()))
                                    .bind(&ep_num)
                                    .bind(&ep_title)
                                    .bind(&season_id)
                                    .execute(&pool)
                                    .await;
                                }
                            }
                        }
                    }
                    Ok(None) => println!("No details found on TMDB for series: {}", series.title),
                    Err(e) => eprintln!("Error searching TMDB for series {}: {}", series.title, e),
                }
                // Sleep to avoid rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                if let Ok(Some(scraped_data)) = series_scraper.scrape(&series.title).await {
                    println!(
                        "Found {} episodes for {}",
                        scraped_data.episodes.len(),
                        series.title
                    );
                    for ep in scraped_data.episodes {
                        let season_id: String = match sqlx::query_as::<_, IdRow>(
                            r#"
                            INSERT INTO "SeriesSeason" (id, number, "seriesId", "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, NOW(), NOW())
                            ON CONFLICT ("seriesId", number) DO UPDATE SET "updatedAt" = NOW()
                            RETURNING id
                            "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(ep.season_number)).bind(&(series.id)).fetch_optional(&pool).await? {
                            Some(row) => row.id,
                            None => sqlx::query_as::<_, IdRow>(
                                r#"SELECT id FROM "SeriesSeason" WHERE "seriesId" = $1 AND number = $2"#).bind(&(series.id)).bind(&(ep.season_number))
                            .fetch_optional(&pool)
                            .await?
                            .map(|row| row.id)
                            .context(format!(
                                "season row missing after insert for series '{}' season {}",
                                series.title, ep.season_number
                            ))?,
                        };

                        let _ = sqlx::query(
                            r#"
                            INSERT INTO "SeriesEpisode" (id, number, title, "videoUrl", "seasonId", "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                            ON CONFLICT ("seasonId", number) DO UPDATE 
                            SET "videoUrl" = EXCLUDED."videoUrl", title = EXCLUDED.title, "updatedAt" = NOW()
                            "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(ep.number)).bind(&(ep.title)).bind(&(ep.url)).bind(&(season_id)).execute(&pool).await;
                    }

                    let final_image_url = tvmaze_image_url.or(scraped_data.image_url);
                    let _ = sqlx::query(
                        r#"
                        UPDATE "Series" 
                        SET "lastScrapedAt" = NOW(), 
                            "imageUrl" = COALESCE($1, "imageUrl"), 
                            description = COALESCE($2, description),
                            genres = COALESCE($3, genres),
                            rating = COALESCE($4, rating),
                            year = COALESCE($5, year),
                            "tmdbId" = COALESCE($6, "tmdbId"),
                            "updatedAt" = NOW()
                        WHERE id = $7
                        "#)
                    .bind(&(final_image_url))
                    .bind(&(tvmaze_description))
                    .bind(&(tvmaze_genres))
                    .bind(&(tmdb_rating))
                    .bind(&(tmdb_year))
                    .bind(&(tmdb_id_str))
                    .bind(&(series.id))
                    .execute(&pool)
                    .await;
                } else {
                    // Update metadata even if video/episode scraping failed
                    let _ = sqlx::query(
                        r#"
                        UPDATE "Series" 
                        SET "lastScrapedAt" = NOW(), 
                            "imageUrl" = COALESCE($1, "imageUrl"), 
                            description = COALESCE($2, description),
                            genres = COALESCE($3, genres),
                            rating = COALESCE($4, rating),
                            year = COALESCE($5, year),
                            "tmdbId" = COALESCE($6, "tmdbId"),
                            "updatedAt" = NOW()
                        WHERE id = $7
                        "#)
                    .bind(&(tvmaze_image_url))
                    .bind(&(tvmaze_description))
                    .bind(&(tvmaze_genres))
                    .bind(&(tmdb_rating))
                    .bind(&(tmdb_year))
                    .bind(&(tmdb_id_str))
                    .bind(&(series.id))
                    .execute(&pool)
                    .await;
                }
            }
        }

        // 4. Fetch movies that need scraping
        if do_movies {
            let movies = sqlx::query_as::<_, IdTitleRow>(
                r#"
                SELECT id, title 
                FROM "Movie" 
                WHERE "lastScrapedAt" IS NULL 
                   OR "lastScrapedAt" < NOW() - INTERVAL '24 hours'
                ORDER BY "lastScrapedAt" ASC NULLS FIRST
                LIMIT 3
                "#)
            .fetch_all(&pool)
            .await?;

            for movie in movies {
                println!("Scraping movie: {}", movie.title);

                // Fetch cover, description and genres from TMDB API
                let mut tmdb_image_url = None;
                let mut tmdb_description = None;
                let mut tmdb_genres = None;
                let mut tmdb_rating = None;
                let mut tmdb_id = None;

                match tmdb.search_movie(&movie.title).await {
                    Ok(Some(tmdb_movie)) => {
                        tmdb_id = Some(tmdb_movie.id.to_string());
                        tmdb_rating = tmdb_movie.get_rating();
                        tmdb_image_url = tmdb_movie.get_image_url();
                        tmdb_description = tmdb_movie.overview;
                        tmdb_genres = tmdb_movie.genres.map(|genres| {
                            genres.into_iter().map(|g| g.name).collect::<Vec<String>>()
                        });
                        println!("Found details on TMDB for movie: {} (Rating: {:?}, ID: {})", movie.title, tmdb_rating, tmdb_movie.id);
                    }
                    Ok(None) => println!("No details found on TMDB for movie: {}", movie.title),
                    Err(e) => eprintln!("Error searching TMDB for movie {}: {}", movie.title, e),
                }

                // Sleep to avoid rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                let mut fallback_url = None;
                if let Some(ref id) = tmdb_id {
                    fallback_url = Some(format!("https://mgeb.top/embed/{}", id));
                }

                let mut resolved_video_url = None;
                let mut scraped_image_url = None;

                if let Ok(Some(scraped_data)) = movie_scraper.scrape(&movie.title).await {
                    scraped_image_url = scraped_data.image_url;
                    if let Some(ep) = scraped_data.episodes.first() {
                        resolved_video_url = Some(ep.url.clone());
                    }
                }

                let final_image_url = tmdb_image_url.or(scraped_image_url);

                let _ = sqlx::query(
                    r#"
                    UPDATE "Movie" 
                    SET "videoUrl" = COALESCE($1, "videoUrl", $2),
                        "imageUrl" = COALESCE($3, "imageUrl"), 
                        description = COALESCE($4, description),
                        genres = COALESCE($5, genres),
                        rating = COALESCE($6, rating),
                        "tmdbId" = COALESCE($7, "tmdbId"),
                        "lastScrapedAt" = NOW(), 
                        "updatedAt" = NOW()
                    WHERE id = $8
                    "#).bind(&(resolved_video_url))
                       .bind(&(fallback_url))
                       .bind(&(final_image_url))
                       .bind(&(tmdb_description))
                       .bind(&(tmdb_genres))
                       .bind(&(tmdb_rating))
                       .bind(&(tmdb_id))
                       .bind(&(movie.id))
                       .execute(&pool)
                       .await;

                if resolved_video_url.is_some() {
                    println!("Successfully scraped movie: {}", movie.title);
                } else {
                    println!("Finished scraping movie (no video URL): {}", movie.title);
                }
            }
        }

        // 5. Fetch manga that need scraping
        if do_manga {
            println!("Checking for manga to scrape...");
            let manga_list = sqlx::query_as::<_, MangaRow>(
                r#"
                SELECT id, title, "lastScrapedAt"
                FROM "Manga" 
                WHERE "lastScrapedAt" IS NULL 
                   OR "lastScrapedAt" < NOW() - INTERVAL '24 hours'
                ORDER BY "lastScrapedAt" ASC NULLS FIRST
                LIMIT 10
                "#)
            .fetch_all(&pool)
            .await?;

            println!(
                "Found {} manga pending scraping in database.",
                manga_list.len()
            );

            for manga in manga_list {
                println!(
                    "Scraping manga: {} (ID: {}, Last Scraped: {:?})",
                    manga.title, manga.id, manga.last_scraped_at
                );

                // Fetch cover and description from Jikan API
                let mut jikan_image_url = None;
                let mut jikan_description = None;
                let mut jikan_genres = None;
                let mut jikan_aired = None;
                let mut jikan_rating = None;
                let mut jikan_status = None;
                match jikan.search_manga(&manga.title).await {
                    Ok(Some(j_manga)) => {
                        jikan_image_url = j_manga.get_image_url();
                        jikan_aired = j_manga.get_aired();
                        jikan_rating = j_manga.get_rating();
                        jikan_status = j_manga.status;
                        jikan_description = j_manga.synopsis;
                        jikan_genres = Some(
                            j_manga
                                .genres
                                .unwrap_or_default()
                                .into_iter()
                                .map(|g| g.name)
                                .collect::<Vec<_>>(),
                        );
                        println!("Found details on Jikan for manga: {}", manga.title);
                    }
                    Ok(None) => println!("No details found on Jikan for manga: {}", manga.title),
                    Err(e) => eprintln!("Error searching Jikan for manga {}: {}", manga.title, e),
                }
                // Sleep to avoid rate limiting
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

                match manga_scraper.scrape(&manga.title).await {
                    Ok(Some(scraped_data)) => {
                        println!(
                            "Found {} chapters for {}",
                            scraped_data.chapters.len(),
                            manga.title
                        );
                        for chap in scraped_data.chapters {
                            let _ = sqlx::query(
                                r#"
                                INSERT INTO "Chapter" (id, number, title, pages, "mangaId", "createdAt", "updatedAt")
                                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                                ON CONFLICT ("mangaId", number) DO UPDATE 
                                SET pages = EXCLUDED.pages, title = EXCLUDED.title, "updatedAt" = NOW()
                                "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(chap.number as f64)).bind(&(chap.title)).bind(&chap.pages).bind(&(manga.id)).execute(&pool)
                            .await;
                        }

                        let final_image_url = jikan_image_url.or(scraped_data.image_url);
                        let _ = sqlx::query(
                            r#"
                            UPDATE "Manga" 
                            SET "lastScrapedAt" = NOW(), 
                                "imageUrl" = COALESCE($1, "imageUrl"), 
                                description = COALESCE($2, description),
                                genres = COALESCE($3, genres),
                                aired = COALESCE($4, aired),
                                rating = COALESCE($5, rating),
                                status = COALESCE($6, status),
                                "updatedAt" = NOW()
                            WHERE id = $7
                            "#).bind(&(final_image_url)).bind(&(jikan_description)).bind(&(jikan_genres)).bind(&(jikan_aired)).bind(&(jikan_rating)).bind(&(jikan_status)).bind(&(manga.id))
                        .execute(&pool)
                        .await;
                    }
                    Ok(None) => {
                        println!("No chapters found for manga: {}", manga.title);
                        let _ = sqlx::query(
                            r#"
                            UPDATE "Manga" 
                            SET "lastScrapedAt" = NOW(), 
                                "imageUrl" = COALESCE($1, "imageUrl"), 
                                description = COALESCE($2, description),
                                genres = COALESCE($3, genres),
                                aired = COALESCE($4, aired),
                                rating = COALESCE($5, rating),
                                status = COALESCE($6, status),
                                "updatedAt" = NOW()
                            WHERE id = $7
                            "#).bind(&(jikan_image_url)).bind(&(jikan_description)).bind(&(jikan_genres)).bind(&(jikan_aired)).bind(&(jikan_rating)).bind(&(jikan_status)).bind(&(manga.id))
                        .execute(&pool)
                        .await;
                    }
                    Err(e) => {
                        eprintln!("Error scraping manga {}: {}", manga.title, e);
                        // Still update timestamp to avoid immediate retry
                        let _ = sqlx::query(
                            r#"
                            UPDATE "Manga" 
                            SET "lastScrapedAt" = NOW(), 
                                "imageUrl" = COALESCE($1, "imageUrl"), 
                                description = COALESCE($2, description),
                                genres = COALESCE($3, genres),
                                aired = COALESCE($4, aired),
                                rating = COALESCE($5, rating),
                                status = COALESCE($6, status),
                                "updatedAt" = NOW()
                            WHERE id = $7
                            "#).bind(&(jikan_image_url)).bind(&(jikan_description)).bind(&(jikan_genres)).bind(&(jikan_aired)).bind(&(jikan_rating)).bind(&(jikan_status)).bind(&(manga.id))
                        .execute(&pool)
                        .await;
                    }
                }
            }
        }

        // 6. Fetch novelas that need scraping
        if do_novela {
            let novelas = sqlx::query_as::<_, IdTitleRow>(
                r#"
                SELECT id, title 
                FROM "Novela" 
                WHERE "lastScrapedAt" IS NULL 
                   OR "lastScrapedAt" < NOW() - INTERVAL '24 hours'
                ORDER BY "lastScrapedAt" ASC NULLS FIRST
                LIMIT 3
                "#)
            .fetch_all(&pool)
            .await?;

            for novela in novelas {
                println!("Scraping novela: {}", novela.title);

                if let Ok(Some(scraped_data)) = novela_scraper.scrape(&novela.title).await {
                    println!(
                        "Found {} episodes for {}",
                        scraped_data.episodes.len(),
                        novela.title
                    );
                    for ep in scraped_data.episodes {
                        let season_id: String = match sqlx::query_as::<_, IdRow>(
                            r#"
                            INSERT INTO "NovelaSeason" (id, number, "novelaId", "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, NOW(), NOW())
                            ON CONFLICT ("novelaId", number) DO UPDATE SET "updatedAt" = NOW()
                            RETURNING id
                            "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(ep.season_number)).bind(&(novela.id)).fetch_optional(&pool).await? {
                            Some(row) => row.id,
                            None => sqlx::query_as::<_, IdRow>(
                                r#"SELECT id FROM "NovelaSeason" WHERE "novelaId" = $1 AND number = $2"#).bind(&(novela.id)).bind(&(ep.season_number))
                            .fetch_optional(&pool)
                            .await?
                            .map(|row| row.id)
                            .context(format!(
                                "season row missing after insert for novela '{}' season {}",
                                novela.title, ep.season_number
                            ))?,
                        };

                        let _ = sqlx::query(
                            r#"
                            INSERT INTO "NovelaEpisode" (id, number, title, "videoUrl", "seasonId", "createdAt", "updatedAt")
                            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                            ON CONFLICT ("seasonId", number) DO UPDATE 
                            SET "videoUrl" = EXCLUDED."videoUrl", title = EXCLUDED.title, "updatedAt" = NOW()
                            "#).bind(&(uuid::Uuid::new_v4().to_string())).bind(&(ep.number)).bind(&(ep.title)).bind(&(ep.url)).bind(&(season_id)).execute(&pool).await;
                    }

                    let _ = sqlx::query(
                        r#"
                        UPDATE "Novela" 
                        SET "lastScrapedAt" = NOW(), 
                            "imageUrl" = COALESCE($1, "imageUrl"), 
                            "updatedAt" = NOW()
                        WHERE id = $2
                        "#).bind(&(scraped_data.image_url)).bind(&(novela.id))
                    .execute(&pool)
                    .await;
                } else {
                    let _ = sqlx::query(
                        r#"
                        UPDATE "Novela" 
                        SET "lastScrapedAt" = NOW(), 
                            "updatedAt" = NOW()
                        WHERE id = $1
                        "#).bind(&(novela.id))
                    .execute(&pool)
                    .await;
                }
            }
        }

        // 7. Fetch channels that need scraping
        if do_channels {
            // First, discover and sync all channels from tvacabo.top/json.php
            println!("Syncing channels list from tvacabo.top...");
            let client = reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .timeout(Duration::from_secs(30))
                .build()?;
            
            match client.get("https://tvacabo.top/json.php")
                .header("Referer", "https://tvacabo.top/")
                .send()
                .await 
            {
                Ok(resp) => {
                    if let Ok(text) = resp.text().await {
                        #[derive(serde::Deserialize)]
                        struct TvacaboChannel {
                            nome: String,
                            url: String,
                        }
                        if let Ok(json_channels) = serde_json::from_str::<Vec<TvacaboChannel>>(&text) {
                            println!("Syncing {} channels to database...", json_channels.len());
                            for ch in json_channels {
                                let slug = slugify(&ch.nome);
                                let uuid = uuid::Uuid::new_v4().to_string();
                                let _ = sqlx::query(
                                    r#"
                                    INSERT INTO "Channel" (id, slug, title, "embedUrl", "createdAt", "updatedAt")
                                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                                    ON CONFLICT (slug) DO UPDATE 
                                    SET title = EXCLUDED.title,
                                        "embedUrl" = EXCLUDED."embedUrl",
                                        "updatedAt" = NOW()
                                    "#)
                                .bind(&uuid)
                                .bind(&slug)
                                .bind(&ch.nome)
                                .bind(&ch.url)
                                .execute(&pool)
                                .await;
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error fetching channels from tvacabo.top/json.php: {:?}", e);
                }
            }

            // Now, select a batch of channels to scrape/resolve
            let channels = sqlx::query_as::<_, ChannelScrapeRow>(
                r#"
                SELECT id, title, "embedUrl" 
                FROM "Channel" 
                WHERE "lastScrapedAt" IS NULL 
                   OR "lastScrapedAt" < NOW() - INTERVAL '12 hours'
                ORDER BY "lastScrapedAt" ASC NULLS FIRST
                LIMIT 5
                "#)
            .fetch_all(&pool)
            .await?;

            for channel in channels {
                println!("Scraping channel: {}", channel.title);
                let resolved_video_url = if let Some(ref embed_url) = channel.embed_url {
                    if embed_url.contains("player.html?url=") {
                        let parsed: Vec<&str> = embed_url.split("player.html?url=").collect();
                        if parsed.len() > 1 {
                            Some(parsed[1].to_string())
                        } else {
                            resolve_video_url(&client, embed_url).await
                        }
                    } else if embed_url.ends_with(".m3u8") || embed_url.contains(".m3u8?") {
                        Some(embed_url.clone())
                    } else {
                        resolve_video_url(&client, embed_url).await
                    }
                } else {
                    if let Ok(Some(scraped_data)) = channel_scraper.scrape(&channel.title).await {
                        Some(scraped_data.video_url)
                    } else {
                        None
                    }
                };

                if let Some(video_url) = resolved_video_url {
                    let _ = sqlx::query(
                        r#"
                        UPDATE "Channel" 
                        SET "videoUrl" = $1, "lastScrapedAt" = NOW(), "updatedAt" = NOW()
                        WHERE id = $2
                        "#).bind(&(video_url)).bind(&(channel.id)).execute(&pool).await;
                    println!("Successfully scraped channel: {} -> {}", channel.title, video_url);
                } else {
                    let _ = sqlx::query(
                        r#"UPDATE "Channel" SET "lastScrapedAt" = NOW() WHERE id = $1"#).bind(&(channel.id))
                    .execute(&pool)
                    .await;
                    println!("Failed to resolve channel: {}", channel.title);
                }
            }
        }

        println!("Sleeping for 10 seconds...");
        sleep(Duration::from_secs(10)).await;
    }
}

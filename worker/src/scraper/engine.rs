use super::models::{ScrapedEpisode, ScrapedMedia};
use super::utils::{
    resolve_video_url, extract_doo_play_candidates, resolve_embed_url_destination,
    extract_chapters_from_html,
};
use anyhow::Result;
use futures::stream::{self, StreamExt};
use scraper::{Html, Selector};
use std::collections::HashSet;

fn build_search_url(base_url: &str, search_query: &str) -> Result<String> {
    let mut url = reqwest::Url::parse(base_url)?;
    let query = urlencoding::encode(search_query);

    if base_url.contains("animesonlineto.to") {
        url.set_path("search");
        url.set_query(Some(&format!("q={}", query)));
    } else {
        url.set_query(Some(&format!("s={}", query)));
    }
    Ok(url.to_string())
}

fn resolve_site_url(base_url: &str, href: &str) -> Result<String> {
    if href.starts_with("http://") || href.starts_with("https://") {
        return Ok(href.to_string());
    }

    let base = reqwest::Url::parse(base_url)?;
    Ok(base.join(href)?.to_string())
}

pub async fn try_scrape_from_site(
    client: &reqwest::Client,
    base_url: &str,
    title: &str,
) -> Result<Option<ScrapedMedia>> {
    use super::utils::parse_anime_title;

    // 1. Search for the anime/series - try full title first, then shorter/base version
    let mut search_titles = vec![title.to_string()];

    let (base_title, _, _) = parse_anime_title(title);
    if base_title.len() >= 3 && base_title != title && !search_titles.contains(&base_title) {
        search_titles.push(base_title.clone());
    }

    if let Some(pos) = title.find(':') {
        let shorter = title[..pos].trim().to_string();
        if shorter.len() >= 3 && !search_titles.contains(&shorter) {
            search_titles.push(shorter);
        }
    }
    if let Some(pos) = title.find('-') {
        let shorter = title[..pos].trim().to_string();
        if shorter.len() >= 3 && !search_titles.contains(&shorter) {
            search_titles.push(shorter);
        }
    }

    let mut matched_pages = Vec::new();
    let mut seen_urls = HashSet::new();

    for search_query in search_titles {
        let search_url = build_search_url(base_url, &search_query)?;
        let response = match client.get(&search_url).send().await {
            Ok(resp) => match resp.text().await {
                Ok(text) => text,
                Err(_) => continue,
            },
            Err(_) => continue,
        };
        let document = Html::parse_document(&response);

        // Selector for search results (DooPlay and others)
        let search_selectors = [
            ".result-item .details .title a",
            "article.item .data h3 a",
            "article.item a",
            "article a",
            ".anime-card a",
            ".post-title a",
            ".vizer-item a",
        ];

        for selector_str in search_selectors {
            if let Ok(selector) = Selector::parse(selector_str) {
                for link in document.select(&selector) {
                    let link_text = link.text().collect::<String>();
                    let link_text_lower = link_text.to_lowercase();
                    let clean_title = title.to_lowercase();

                    // Extract base titles for matching (to match across different seasons)
                    let (query_base, _, _) = parse_anime_title(&clean_title);
                    let (link_base, _, _) = parse_anime_title(&link_text_lower);

                    // Title verification: check if names match significantly on base titles or full titles
                    if link_base.contains(&query_base)
                        || query_base.contains(&link_base)
                        || is_significant_overlap(&link_base, &query_base)
                        || link_text_lower.contains(&clean_title)
                        || clean_title.contains(&link_text_lower)
                        || is_significant_overlap(&link_text_lower, &clean_title)
                    {
                        if let Some(href) = link.value().attr("href") {
                            if let Ok(resolved_url) = resolve_site_url(base_url, href) {
                                if resolved_url.contains("/community/")
                                    || resolved_url.contains("/group/")
                                    || resolved_url.contains("/profile/")
                                    || resolved_url.contains("/collection/")
                                    || resolved_url.contains("/tag/")
                                {
                                    continue;
                                }

                                if seen_urls.insert(resolved_url.clone()) {
                                    // Try to find image in the same container
                                    let mut image_url = None;
                                    if let Some(parent) = link.parent() {
                                        let mut container = parent;
                                        for _ in 0..3 {
                                            if let Some(el) = scraper::ElementRef::wrap(container) {
                                                let img_selector = Selector::parse("img").unwrap();
                                                if let Some(img) = el.select(&img_selector).next() {
                                                    image_url = img
                                                        .value()
                                                        .attr("data-src")
                                                        .or(img.value().attr("data-lazy-src"))
                                                        .or(img.value().attr("src"))
                                                        .map(|s| s.to_string());
                                                    if image_url.is_some() {
                                                        break;
                                                    }
                                                }
                                            }
                                            if let Some(p) = container.parent() {
                                                container = p;
                                            } else {
                                                break;
                                            }
                                        }
                                    }

                                    // Parse season and part from the link text (e.g. "Sousou no Frieren 2nd Season Part 2")
                                    let (_, detected_season, detected_part) = parse_anime_title(&link_text);

                                    matched_pages.push((resolved_url, image_url, detected_season, detected_part));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if matched_pages.is_empty() {
        return Ok(None);
    }

    // Sort matched pages so that:
    // 1. Lower seasons are processed first.
    // 2. Lower parts are processed first.
    matched_pages.sort_by(|a, b| {
        a.2.cmp(&b.2).then_with(|| {
            let part_a = a.3.unwrap_or(1);
            let part_b = b.3.unwrap_or(1);
            part_a.cmp(&part_b)
        })
    });

    let mut all_episodes = Vec::new();
    let mut final_image_url = None;
    let mut max_ep_for_season: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();

    for (media_page_url, image_url, detected_season, detected_part) in matched_pages {
        if final_image_url.is_none() {
            final_image_url = image_url;
        }

        println!("Scraping matched page (Season {}, Part {:?}): {}", detected_season, detected_part, media_page_url);

        // Fetch page content
        let page_response = match client.get(&media_page_url).send().await {
            Ok(resp) => match resp.text().await {
                Ok(text) => text,
                Err(_) => continue,
            },
            Err(_) => continue,
        };
        let media_document = Html::parse_document(&page_response);

        // Try to find image on page if still missing
        let mut current_image_url = final_image_url.clone();
        if current_image_url.is_none() {
            let page_img_selectors = [
                ".poster img",
                ".sheader .poster img",
                "img.wp-post-image",
                ".media-poster img",
            ];
            for sel in page_img_selectors {
                if let Ok(selector) = Selector::parse(sel) {
                    if let Some(img) = media_document.select(&selector).next() {
                        current_image_url = img
                            .value()
                            .attr("data-src")
                            .or(img.value().attr("data-lazy-src"))
                            .or(img.value().attr("src"))
                            .map(|s| s.to_string());
                        if current_image_url.is_some() {
                            break;
                        }
                    }
                }
            }
        }
        if final_image_url.is_none() {
            final_image_url = current_image_url.clone();
        }

        // Normalize image URL
        if let Some(ref mut url) = final_image_url {
            if url.starts_with("//") {
                *url = format!("https:{}", url);
            } else if url.starts_with('/') {
                if let Ok(resolved) = resolve_site_url(base_url, url) {
                    *url = resolved;
                }
            }
        }

        let mut page_episodes = Vec::new();

        // 3. Handle DooPlay Season structure
        let season_selector = Selector::parse(".se-c").unwrap();
        let season_title_selector = Selector::parse(".se-q .se-t, .se-q .title").unwrap();
        let episode_list_selector = Selector::parse("ul.episodios li, .episodios article, .episodios .item, .list-episodes li").unwrap();
        let episode_link_selector = Selector::parse(".episodiotitle a, a").unwrap();
        let episode_num_selector = Selector::parse(".numerando").unwrap();

        let mut seasons_found = false;
        for season_node in media_document.select(&season_selector) {
            seasons_found = true;
            let mut season_num = season_node
                .select(&season_title_selector)
                .next()
                .and_then(|n| {
                    let text = n.text().collect::<String>().to_lowercase();
                    text.chars()
                        .filter(|c| c.is_digit(10))
                        .collect::<String>()
                        .parse::<i32>()
                        .ok()
                })
                .unwrap_or(1);

            // Override season number if page title indicates a higher season
            if season_num == 1 && detected_season > 1 {
                season_num = detected_season;
            }

            for ep_node in season_node.select(&episode_list_selector) {
                if let Some(link_node) = ep_node.select(&episode_link_selector).next() {
                    let ep_url = link_node.value().attr("href").unwrap_or("").to_string();
                    let ep_title = link_node.text().collect::<String>().trim().to_string();
                    let ep_num_text = ep_node
                        .select(&episode_num_selector)
                        .next()
                        .map(|n| n.text().collect::<String>())
                        .unwrap_or_default();

                    let ep_num = ep_num_text
                        .split('-')
                        .last()
                        .unwrap_or("0")
                        .trim()
                        .chars()
                        .filter(|c| c.is_digit(10))
                        .collect::<String>()
                        .parse::<i32>()
                        .unwrap_or(0);

                    let mut ep_image = ep_node
                        .select(&Selector::parse("img").unwrap())
                        .next()
                        .and_then(|img| {
                            img.value()
                                .attr("data-src")
                                .or(img.value().attr("data-lazy-src"))
                                .or(img.value().attr("src"))
                        })
                        .map(|s| s.to_string());

                    if let Some(ref mut url) = ep_image {
                        if url.starts_with("//") {
                            *url = format!("https:{}", url);
                        } else if url.starts_with('/') {
                            if let Ok(resolved) = resolve_site_url(base_url, url) {
                                *url = resolved;
                            }
                        }
                    }

                    if let Ok(resolved_ep_url) = resolve_site_url(base_url, &ep_url) {
                        page_episodes.push(ScrapedEpisode {
                            season_number: season_num,
                            number: ep_num,
                            title: Some(ep_title),
                            url: resolved_ep_url,
                            image_url: ep_image,
                        });
                    }
                }
            }
        }

        // 4. Fallback for non-DooPlay sites
        if !seasons_found {
            let fallback_episode_selector = Selector::parse(".episode-list a, .list-episodes a, .episodes-list a, .episodes a, .vizer-episodes a, #episodios a, .capitulos a, .eplist a, .clist a").unwrap();
            for (i, ep_link) in media_document
                .select(&fallback_episode_selector)
                .enumerate()
            {
                let ep_url = ep_link.value().attr("href").unwrap_or("").to_string();
                if !ep_url.is_empty() && !ep_url.starts_with('#') {
                    let mut ep_image = ep_link
                        .select(&Selector::parse("img").unwrap())
                        .next()
                        .or_else(|| {
                            ep_link.parent().and_then(|parent| {
                                scraper::ElementRef::wrap(parent)
                                    .and_then(|el| el.select(&Selector::parse("img").unwrap()).next())
                            })
                        })
                        .and_then(|img| {
                            img.value()
                                .attr("data-src")
                                .or(img.value().attr("data-lazy-src"))
                                .or(img.value().attr("src"))
                        })
                        .map(|s| s.to_string());

                    if let Some(ref mut url) = ep_image {
                        if url.starts_with("//") {
                            *url = format!("https:{}", url);
                        } else if url.starts_with('/') {
                            if let Ok(resolved) = resolve_site_url(base_url, url) {
                                *url = resolved;
                            }
                        }
                    }

                    if let Ok(resolved_ep_url) = resolve_site_url(base_url, &ep_url) {
                        page_episodes.push(ScrapedEpisode {
                            season_number: detected_season,
                            number: (i + 1) as i32,
                            title: Some(ep_link.text().collect::<String>().trim().to_string()),
                            url: resolved_ep_url,
                            image_url: ep_image,
                        });
                    }
                }
            }
        }

        // 5. If still no episodes found, check if there are chapters/seasons inside the embed player options
        if page_episodes.is_empty() {
            let doo_play_embeds = extract_doo_play_candidates(client, &page_response, &media_page_url).await;
            for embed_url in doo_play_embeds {
                let final_embed_url = resolve_embed_url_destination(client, &embed_url).await;
                if let Ok(embed_resp) = client.get(&final_embed_url).send().await {
                    if let Ok(embed_html) = embed_resp.text().await {
                        let chapters = extract_chapters_from_html(&embed_html, &final_embed_url);
                        if !chapters.is_empty() {
                            println!("Found {} chapters in embed player: {}", chapters.len(), final_embed_url);
                            for ch in chapters {
                                page_episodes.push(ScrapedEpisode {
                                    season_number: if ch.season == 1 && detected_season > 1 { detected_season } else { ch.season },
                                    number: ch.number,
                                    title: Some(ch.title),
                                    url: ch.url,
                                    image_url: None,
                                });
                            }
                            break;
                        }
                    }
                }
            }
        }

        // 6. If still no episodes found, it might be a movie/single episode page
        if page_episodes.is_empty() {
            page_episodes.push(ScrapedEpisode {
                season_number: detected_season,
                number: 1,
                title: Some(title.to_string()),
                url: media_page_url.clone(),
                image_url: final_image_url.clone(),
            });
        }

        // Apply automatic offset if episodes restart from 1
        if !page_episodes.is_empty() {
            page_episodes.sort_by_key(|e| e.number);
            let first_num = page_episodes[0].number;
            let current_season = page_episodes[0].season_number;

            let max_existing = max_ep_for_season.entry(current_season).or_insert(0);
            if first_num <= *max_existing {
                let offset = *max_existing;
                println!("Applying offset of +{} to season {} episodes from page: {}", offset, current_season, media_page_url);
                for ep in &mut page_episodes {
                    ep.number += offset;
                }
            }

            let new_max = page_episodes.iter().map(|e| e.number).max().unwrap_or(0);
            if new_max > *max_existing {
                *max_existing = new_max;
            }
        }

        all_episodes.extend(page_episodes);
    }

    if !all_episodes.is_empty() {
        println!("Resolving video URLs for {} total episodes...", all_episodes.len());
        let mut resolved_episodes = Vec::new();
        let mut stream = stream::iter(all_episodes)
            .map(|mut ep| {
                let client = client.clone();
                async move {
                    if let Some(video_url) = resolve_video_url(&client, &ep.url).await {
                        ep.url = video_url;
                        Some(ep)
                    } else {
                        None
                    }
                }
            })
            .buffer_unordered(10);

        while let Some(maybe_ep) = stream.next().await {
            if let Some(ep) = maybe_ep {
                resolved_episodes.push(ep);
            }
        }

        // Deduplicate resolved episodes by (season_number, number)
        let mut unique_episodes = Vec::new();
        let mut seen_eps = HashSet::new();
        unique_episodes.clear();

        resolved_episodes.sort_by(|a, b| {
            a.season_number
                .cmp(&b.season_number)
                .then(a.number.cmp(&b.number))
        });

        for ep in resolved_episodes {
            if seen_eps.insert((ep.season_number, ep.number)) {
                unique_episodes.push(ep);
            }
        }

        return Ok(Some(ScrapedMedia {
            title: title.to_string(),
            image_url: final_image_url,
            episodes: unique_episodes,
        }));
    }

    Ok(None)
}

fn is_significant_overlap(a: &str, b: &str) -> bool {
    let a_words: HashSet<_> = a.split_whitespace().filter(|w| w.len() > 2).collect();
    let b_words: HashSet<_> = b.split_whitespace().filter(|w| w.len() > 2).collect();

    if a_words.is_empty() || b_words.is_empty() {
        return false;
    }

    let intersection = a_words.intersection(&b_words).count();
    let min_len = a_words.len().min(b_words.len());

    (intersection as f32 / min_len as f32) >= 0.7
}

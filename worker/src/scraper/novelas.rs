use super::models::{DiscoveryItem, ScrapedMedia};
use super::utils::{extract_doo_play_candidates, extract_candidates};
use anyhow::Result;
use scraper::{Html, Selector};

fn is_significant_overlap(a: &str, b: &str) -> bool {
    use std::collections::HashSet;
    let a_words: HashSet<_> = a.split_whitespace().filter(|w| w.len() > 2).collect();
    let b_words: HashSet<_> = b.split_whitespace().filter(|w| w.len() > 2).collect();

    if a_words.is_empty() || b_words.is_empty() {
        return false;
    }

    let intersection = a_words.intersection(&b_words).count();
    let min_len = a_words.len().min(b_words.len());

    (intersection as f32 / min_len as f32) >= 0.7
}

fn build_search_url(base_url: &str, search_query: &str) -> Result<String> {
    let mut url = reqwest::Url::parse(base_url)?;
    let query = urlencoding::encode(search_query);
    url.set_query(Some(&format!("s={}", query)));
    Ok(url.to_string())
}

pub struct NovelaScraper {
    client: reqwest::Client,
    base_urls: Vec<&'static str>,
}

impl NovelaScraper {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            base_urls: vec![
                "https://noveflixtv.com",
                "https://maxnovelas.com",
                "https://upnovelas.com",
            ],
        }
    }

    pub async fn scrape(&self, title: &str) -> Result<Option<ScrapedMedia>> {
        for base_url in &self.base_urls {
            println!("Trying site: {}", base_url);
            
            let mut search_titles = vec![title.to_string()];
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

            let mut media_page_url = None;
            let mut final_image_url = None;

            for search_query in search_titles {
                let search_url = match build_search_url(base_url, &search_query) {
                    Ok(url) => url,
                    Err(_) => continue,
                };

                let response = match self.client.get(&search_url).send().await {
                    Ok(resp) => match resp.text().await {
                        Ok(text) => text,
                        Err(_) => continue,
                    },
                    Err(_) => continue,
                };

                let document = Html::parse_document(&response);
                let search_selectors = [
                    ".result-item .details .title a",
                    "article.item .data h3 a",
                    "article.item a",
                    "article a",
                    ".anime-card a",
                    ".post-title a",
                    ".vizer-item a",
                ];

                'selectors: for selector_str in search_selectors {
                    if let Ok(selector) = Selector::parse(selector_str) {
                        for link in document.select(&selector) {
                            let link_text = link.text().collect::<String>().to_lowercase();
                            let clean_title = title.to_lowercase();

                            if link_text.contains(&clean_title)
                                || clean_title.contains(&link_text)
                                || is_significant_overlap(&link_text, &clean_title)
                            {
                                if let Some(href) = link.value().attr("href") {
                                    // Resolve absolute URL
                                    if href.starts_with("http://") || href.starts_with("https://") {
                                        media_page_url = Some(href.to_string());
                                    } else {
                                        if let Ok(base) = reqwest::Url::parse(base_url) {
                                            if let Ok(joined) = base.join(href) {
                                                media_page_url = Some(joined.to_string());
                                            }
                                        }
                                    }

                                    // Try to find image in parent elements
                                    if let Some(parent) = link.parent() {
                                        let mut container = parent;
                                        for _ in 0..3 {
                                            if let Some(el) = scraper::ElementRef::wrap(container) {
                                                let img_selector = Selector::parse("img").unwrap();
                                                if let Some(img) = el.select(&img_selector).next() {
                                                    let img_url = img
                                                        .value()
                                                        .attr("data-src")
                                                        .or(img.value().attr("data-lazy-src"))
                                                        .or(img.value().attr("src"))
                                                        .map(|s| s.to_string());
                                                    if img_url.is_some() {
                                                        final_image_url = img_url;
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

                                    if media_page_url.is_some() {
                                        break 'selectors;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if let Some(page_url) = media_page_url {
                let page_response = match self.client.get(&page_url).send().await {
                    Ok(resp) => match resp.text().await {
                        Ok(text) => text,
                        Err(_) => continue,
                    },
                    Err(_) => continue,
                };
                let media_document = Html::parse_document(&page_response);

                // Try to find image on page if not found in search results
                if final_image_url.is_none() {
                    let page_img_selectors = [
                        ".poster img",
                        ".sheader .poster img",
                        "img.wp-post-image",
                        ".media-poster img",
                    ];
                    for sel in page_img_selectors {
                        if let Ok(selector) = Selector::parse(sel) {
                            if let Some(img) = media_document.select(&selector).next() {
                                final_image_url = img
                                    .value()
                                    .attr("data-src")
                                    .or(img.value().attr("data-lazy-src"))
                                    .or(img.value().attr("src"))
                                    .map(|s| s.to_string());
                                if final_image_url.is_some() {
                                    break;
                                }
                            }
                        }
                    }
                }

                // Normalize image URL
                if let Some(ref mut img_url) = final_image_url {
                    if img_url.starts_with("//") {
                        *img_url = format!("https:{}", img_url);
                    } else if img_url.starts_with('/') {
                        if let Ok(base) = reqwest::Url::parse(base_url) {
                            if let Ok(joined) = base.join(img_url) {
                                *img_url = joined.to_string();
                            }
                        }
                    }
                }

                // Find player candidates (DooPlay Ajax options)
                let mut player_url = None;
                let doo_play_embeds = extract_doo_play_candidates(&self.client, &page_response, &page_url).await;
                for embed_url in doo_play_embeds {
                    if embed_url.contains("novefx.biz") || embed_url.contains("novoformato") {
                        player_url = Some(embed_url);
                        break;
                    }
                }

                // If not found in DooPlay options, search for any iframe or script in the HTML pointing to novefx.biz or novoformato
                if player_url.is_none() {
                    let candidates = extract_candidates(&page_response, &page_url);
                    for candidate in candidates {
                        if candidate.contains("novefx.biz") || candidate.contains("novoformato") {
                            player_url = Some(candidate);
                            break;
                        }
                    }
                }

                // If we found a player URL, return a single episode containing it
                if let Some(url) = player_url {
                    use super::models::ScrapedEpisode;
                    println!("Successfully scraped novela {} with player url: {}", title, url);
                    return Ok(Some(ScrapedMedia {
                        title: title.to_string(),
                        image_url: final_image_url.clone(),
                        episodes: vec![ScrapedEpisode {
                            season_number: 1,
                            number: 1,
                            title: Some("Player Completo".to_string()),
                            url,
                            image_url: final_image_url,
                        }],
                    }));
                }
            }
        }
        Ok(None)
    }

    pub async fn get_latest_novelas(&self) -> Result<Vec<DiscoveryItem>> {
        let mut items = Vec::new();
        for base_url in &self.base_urls {
            match self.client.get(*base_url).send().await {
                Ok(resp) => {
                    if let Ok(html) = resp.text().await {
                        let document = Html::parse_document(&html);
                        let item_selector = Selector::parse("article.item, .list-media .item, .episodios-list li, .list-episodes li").unwrap();
                        let title_selector = Selector::parse(".data h3 a, .title a, a").unwrap();
                        let img_selector = Selector::parse("img").unwrap();

                        let mut site_count = 0;
                        for element in document.select(&item_selector) {
                            let title = element.select(&title_selector)
                                .map(|el| el.text().collect::<String>().trim().to_string())
                                .find(|t| !t.is_empty());

                            if let Some(title) = title {
                                let mut image_url = element
                                    .select(&img_selector)
                                    .next()
                                    .and_then(|img| {
                                        img.value()
                                            .attr("data-src")
                                            .or(img.value().attr("data-lazy-src"))
                                            .or(img.value().attr("src"))
                                    })
                                    .map(|s| s.to_string());

                                if let Some(url) = image_url {
                                    if url.starts_with("//") {
                                        image_url = Some(format!("https:{}", url));
                                    } else if url.starts_with('/') {
                                        image_url = Some(format!("{}{}", base_url, url));
                                    } else {
                                        image_url = Some(url);
                                    }
                                }

                                if !items.iter().any(|i: &DiscoveryItem| i.title == title) {
                                    items.push(DiscoveryItem { title, image_url });
                                    site_count += 1;
                                }
                            }
                        }
                        println!("Found {} novelas on {}", site_count, base_url);
                    }
                }
                Err(e) => eprintln!("Error fetching latest novelas from {}: {}", base_url, e),
            }
        }
        Ok(items)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_latest_novelas() {
        let scraper = NovelaScraper::new();
        match scraper.get_latest_novelas().await {
            Ok(items) => {
                println!("Scraped {} novelas in total", items.len());
                for (i, item) in items.iter().enumerate().take(5) {
                    println!("Novela {}: Title: {}, Image: {:?}", i, item.title, item.image_url);
                }
                assert!(!items.is_empty(), "Failed to discover any novelas from the sources!");
            }
            Err(e) => {
                panic!("Error scraping latest novelas: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_scrape_novela_search() {
        let scraper = NovelaScraper::new();
        // Test scraping a known telenovela, like "Renascer" or "Pantanal"
        match scraper.scrape("Renascer").await {
            Ok(Some(media)) => {
                println!("Found novela: {}", media.title);
                println!("Image: {:?}", media.image_url);
                println!("Episodes count: {}", media.episodes.len());
                if let Some(ep) = media.episodes.first() {
                    println!("First Episode: Season {}, Ep {}, Title: {:?}, URL: {}", 
                        ep.season_number, ep.number, ep.title, ep.url);
                }
                assert!(!media.episodes.is_empty(), "No episodes found for the novela");
            }
            Ok(None) => {
                println!("Novela 'Renascer' not found, trying fallback 'Pantanal'");
                match scraper.scrape("Pantanal").await {
                    Ok(Some(media)) => {
                        println!("Found novela: {}", media.title);
                        assert!(!media.episodes.is_empty());
                    }
                    Ok(None) => {
                        panic!("No novelas found for search 'Renascer' or 'Pantanal'");
                    }
                    Err(e) => panic!("Error during fallback scrape: {}", e),
                }
            }
            Err(e) => {
                panic!("Error scraping novela search: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_scrape_nobreza_do_amor() {
        let scraper = NovelaScraper::new();
        match scraper.scrape("A Nobreza do Amor").await {
            Ok(Some(media)) => {
                println!("Found novela: {}", media.title);
                println!("Image: {:?}", media.image_url);
                println!("Episodes count: {}", media.episodes.len());
                if let Some(ep) = media.episodes.first() {
                    println!("First Episode: Season {}, Ep {}, Title: {:?}, URL: {}", 
                        ep.season_number, ep.number, ep.title, ep.url);
                }
                assert!(!media.episodes.is_empty(), "No episodes found for A Nobreza do Amor");
            }
            Ok(None) => {
                panic!("Novela 'A Nobreza do Amor' not found!");
            }
            Err(e) => {
                panic!("Error scraping 'A Nobreza do Amor': {}", e);
            }
        }
    }
}


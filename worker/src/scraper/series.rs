use super::engine::try_scrape_from_site;
use super::models::ScrapedMedia;
use anyhow::Result;

pub struct SeriesScraper {
    client: reqwest::Client,
    base_urls: Vec<&'static str>,
}

impl SeriesScraper {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            base_urls: vec![
                "https://startflix.co",
                "https://megacine.quest",
                "https://thefilmes.net",
                "https://cyberfilme.net/",
                "https://vizer.life",
                "https://filmesservidormega.net/",
                "https://filmesgrates.net/series/",
            ],
        }
    }

    pub async fn scrape(&self, title: &str) -> Result<Option<ScrapedMedia>> {
        for base_url in &self.base_urls {
            println!("Trying site: {}", base_url);
            match try_scrape_from_site(&self.client, base_url, title).await {
                Ok(Some(media)) => {
                    println!("Successfully scraped series {} from {}", title, base_url);
                    return Ok(Some(media));
                }
                Ok(None) => {
                    println!("No results for series {} on {}", title, base_url);
                    continue;
                }
                Err(e) => {
                    eprintln!("Error scraping series from {}: {}", base_url, e);
                    continue;
                }
            }
        }
        Ok(None)
    }
}

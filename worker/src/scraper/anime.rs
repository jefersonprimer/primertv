use super::engine::try_scrape_from_site;
use super::models::ScrapedMedia;
use anyhow::Result;

pub struct AnimeScraper {
    client: reqwest::Client,
    base_urls: Vec<&'static str>,
}

impl AnimeScraper {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            base_urls: vec![
                "https://animesonlinecc.to",
                "https://animeq.cloud",
                "https://animesdrive.cloud",
                "https://animesonlines.net",
                "https://sushianimes.com.br",
                "https://meusanimes.blog",
                "https://animesdigital.org/index", 
                "https://goyabu.io/inicio", 
                "https://chia-anime.su/home", 
                "https://kissanime.com.cv",
                "https://9animes.ro",
                "https://animedao.in",
                "https://animesbr.lat",
                "https://betteranime.io/home",
                "https://anroll.cc", 
                "https://animesonline.cloud",
                "https://otakuplay.com.br", 
                "https://animeav1.com", 
                "https://animepahe.ch", 
                "https://anikoto.cz/home",
                "https://animenosub.to",
                "https://animesonlinehdk.com",
                "https://tsukuyomi.tv/home",
                "https://anime.nexus",
                "https://jkanime.net",
                "https://anizone.to/",
                "https://gaiaflix.live/",
                "https://gogoanime.com.by"
            ],
        }
    }

    pub async fn scrape(&self, title: &str) -> Result<Option<ScrapedMedia>> {
        for base_url in &self.base_urls {
            println!("Trying site: {}", base_url);
            match try_scrape_from_site(&self.client, base_url, title).await {
                Ok(Some(media)) => {
                    println!("Successfully scraped anime {} from {}", title, base_url);
                    return Ok(Some(media));
                }
                Ok(None) => {
                    println!("No results for anime {} on {}", title, base_url);
                    continue;
                }
                Err(e) => {
                    eprintln!("Error scraping anime from {}: {}", base_url, e);
                    continue;
                }
            }
        }
        Ok(None)
    }
}

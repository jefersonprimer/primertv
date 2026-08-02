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
                "https://sushianimes.com.br",
                "https://topanimes.net/",
                "https://animesbr.lat",
                "https://anroll.cc",
                "https://animesonlinecc.to",
                "https://meusanimes.blog/",
                "https://betteranime.io/home/",
                "https://animesonline.cloud",
                "https://otakuplay.com.br",
                "http://goyabu.io/inicio",
                "https://animesonlines.net",
                "https://animesonlineto.to",
                "https://animeav1.com/",
                "https://animepahe.ch/",
                "https://gaiaflix.live/",
                "https://kissanime.com.cv/",
                "https://animesdigital.org/pagina-inicial/",
                "https://anikoto.cz/home",
                "https://www.animeonsen.xyz/",
                "https://anizone.to/",
                "https://animeheaven.me/",  
                "https://mkissa.to/anime?tr=sub",
                "https://anime.nexus/",
                "https://animenosub.to/",
                "https://jkanime.net/",
                "https://chia-anime.su/",
                "https://tsukuyomi.tv/home"
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

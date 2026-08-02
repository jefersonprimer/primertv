use super::models::ScrapedChannel;
use super::utils::resolve_video_url;
use anyhow::Result;
use scraper::{Html, Selector};
use serde::Deserialize;

pub struct ChannelScraper {
    client: reqwest::Client,
    base_urls: Vec<&'static str>,
}

impl ChannelScraper {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            base_urls: vec![
                "https://tvacabo.top",
                "https://www.cxtv.com.br",
                "https://www.olhosnatv.com.br",
                "https://www.soultv.com.br",
                "https://pluto.tv",
                "https://multicanaishd.camp",
            ],
        }
    }

    pub async fn scrape(&self, channel_name: &str) -> Result<Option<ScrapedChannel>> {
        for base_url in &self.base_urls {
            match self.try_scrape_from_site(base_url, channel_name).await {
                Ok(Some(channel)) => return Ok(Some(channel)),
                _ => continue,
            }
        }
        Ok(None)
    }

    async fn try_scrape_from_site(
        &self,
        base_url: &str,
        channel_name: &str,
    ) -> Result<Option<ScrapedChannel>> {
        if base_url.contains("tvacabo.top") {
            let json_url = format!("{}/json.php", base_url);
            let response = self.client.get(&json_url)
                .header("Referer", format!("{}/", base_url))
                .send()
                .await?;

            if response.status().is_success() {
                let text = response.text().await?;

                #[derive(Deserialize, Debug)]
                struct TvacaboChannel {
                    nome: String,
                    url: String,
                }

                if let Ok(channels) = serde_json::from_str::<Vec<TvacaboChannel>>(&text) {
                    let clean_name = channel_name.to_lowercase();
                    // Find a channel that matches the channel name fuzzy or exactly
                    let found_channel = channels.iter().find(|ch| {
                        let nome_lower = ch.nome.to_lowercase();
                        nome_lower == clean_name || nome_lower.contains(&clean_name)
                    });

                    if let Some(ch) = found_channel {
                        // Extract direct m3u8 or follow the player url
                        let video_url = if ch.url.contains("player.html?url=") {
                            let parsed: Vec<&str> = ch.url.split("player.html?url=").collect();
                            if parsed.len() > 1 {
                                Some(parsed[1].to_string())
                            } else {
                                resolve_video_url(&self.client, &ch.url).await
                            }
                        } else if ch.url.ends_with(".m3u8") || ch.url.contains(".m3u8?") {
                            Some(ch.url.clone())
                        } else {
                            resolve_video_url(&self.client, &ch.url).await
                        };

                        if let Some(video_url) = video_url {
                            return Ok(Some(ScrapedChannel {
                                title: channel_name.to_string(),
                                image_url: None,
                                video_url,
                            }));
                        }
                    }
                }
            }
            return Ok(None);
        }

        let search_url = format!("{}/?s={}", base_url, urlencoding::encode(channel_name));
        let response = self.client.get(&search_url).send().await?.text().await?;
        let document = Html::parse_document(&response);

        let search_selectors = [
            ".result-item .details .title a",
            "article.item .data h3 a",
            "article.item a",
            ".post-title a",
            "a[title*='Assistir']",
            "a",
        ];

        for selector_str in search_selectors {
            if let Ok(selector) = Selector::parse(selector_str) {
                for link in document.select(&selector) {
                    let link_text = link.text().collect::<String>().to_lowercase();
                    let clean_name = channel_name.to_lowercase();

                    if link_text.contains(&clean_name) {
                        if let Some(href) = link.value().attr("href") {
                            let channel_page_url = if href.starts_with('/') {
                                format!("{}{}", base_url, href)
                            } else {
                                href.to_string()
                            };

                            let page_response = self
                                .client
                                .get(&channel_page_url)
                                .send()
                                .await?
                                .text()
                                .await?;
                            let page_doc = Html::parse_document(&page_response);

                            let img_selector = Selector::parse(
                                ".poster img, img.wp-post-image, .sheader .poster img",
                            )
                            .unwrap();
                            let image_url = page_doc
                                .select(&img_selector)
                                .next()
                                .and_then(|img| img.value().attr("src"))
                                .map(|s| s.to_string());

                            let video_url = resolve_video_url(&self.client, &channel_page_url).await;

                            if let Some(video_url) = video_url {
                                return Ok(Some(ScrapedChannel {
                                    title: channel_name.to_string(),
                                    image_url,
                                    video_url,
                                }));
                            }
                        }
                    }
                }
            }
        }

        Ok(None)
    }
}


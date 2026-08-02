use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct TvMazeImage {
    pub medium: Option<String>,
    pub original: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct TvMazeShow {
    pub name: String,
    pub summary: Option<String>,
    pub image: Option<TvMazeImage>,
    pub genres: Option<Vec<String>>,
}

impl TvMazeShow {
    pub fn get_description(&self) -> Option<String> {
        self.summary.as_ref().map(|s| strip_html_tags(s))
    }

    pub fn get_image_url(&self) -> Option<String> {
        self.image
            .as_ref()
            .and_then(|img| img.original.clone().or_else(|| img.medium.clone()))
    }
}

fn strip_html_tags(s: &str) -> String {
    let mut clean = String::new();
    let mut in_tag = false;
    for c in s.chars() {
        if c == '<' {
            in_tag = true;
        } else if c == '>' {
            in_tag = false;
        } else if !in_tag {
            clean.push(c);
        }
    }
    clean
}

pub struct ImdbService {
    client: reqwest::Client,
}

impl ImdbService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .build()
                .unwrap(),
        }
    }

    pub async fn get_popular_series(&self) -> Result<Vec<TvMazeShow>> {
        // Using TVMaze API as it's more reliable than scraping IMDb
        let url = "https://api.tvmaze.com/shows?page=0";
        let resp = self
            .client
            .get(url)
            .send()
            .await?
            .json::<Vec<TvMazeShow>>()
            .await?;

        let series = resp.into_iter().take(50).collect();

        Ok(series)
    }

    pub async fn search_series(&self, title: &str) -> Result<Option<TvMazeShow>> {
        let url = format!(
            "https://api.tvmaze.com/singlesearch/shows?q={}",
            urlencoding::encode(title)
        );
        let response = self.client.get(&url).send().await?;

        if response.status() == 404 {
            return Ok(None);
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "TVMaze API returned status {}",
                response.status()
            ));
        }

        let show = response.json::<TvMazeShow>().await?;
        Ok(Some(show))
    }
}

use anyhow::Result;
use serde::Deserialize;

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct JikanImageFormat {
    pub image_url: Option<String>,
    pub small_image_url: Option<String>,
    pub large_image_url: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanImages {
    pub jpg: Option<JikanImageFormat>,
    pub webp: Option<JikanImageFormat>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanGenre {
    pub name: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanTitle {
    #[serde(rename = "type")]
    pub title_type: String,
    pub title: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanBroadcast {
    pub day: Option<String>,
    pub time: Option<String>,
    pub timezone: Option<String>,
    pub string: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanAired {
    pub string: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanAnime {
    pub mal_id: Option<i32>,
    pub title: String,
    pub titles: Option<Vec<JikanTitle>>,
    pub synopsis: Option<String>,
    pub images: Option<JikanImages>,
    pub genres: Option<Vec<JikanGenre>>,
    pub aired: Option<JikanAired>,
    pub rating: Option<String>,
    pub score: Option<f64>,
    pub status: Option<String>,
    pub duration: Option<String>,
    #[serde(rename = "type")]
    pub type_name: Option<String>,
    pub season: Option<String>,
    pub year: Option<i32>,
    pub broadcast: Option<JikanBroadcast>,
    pub rank: Option<i32>,
    pub popularity: Option<i32>,
    pub members: Option<i32>,
}

impl JikanAnime {
    pub fn get_default_title(&self) -> String {
        if let Some(titles) = &self.titles {
            for t in titles {
                if t.title_type == "Default" {
                    return t.title.clone();
                }
            }
        }
        self.title.clone()
    }

    pub fn get_english_title(&self) -> Option<String> {
        if let Some(titles) = &self.titles {
            for t in titles {
                if t.title_type == "English" {
                    return Some(t.title.clone());
                }
            }
        }
        None
    }

    pub fn get_image_url(&self) -> Option<String> {
        self.images.as_ref().and_then(|img| {
            if let Some(jpg) = &img.jpg {
                if jpg.large_image_url.is_some() {
                    return jpg.large_image_url.clone();
                }
                if jpg.image_url.is_some() {
                    return jpg.image_url.clone();
                }
            }
            if let Some(webp) = &img.webp {
                if webp.large_image_url.is_some() {
                    return webp.large_image_url.clone();
                }
                if webp.image_url.is_some() {
                    return webp.image_url.clone();
                }
            }
            None
        })
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanManga {
    pub title: String,
    pub synopsis: Option<String>,
    pub images: Option<JikanImages>,
    pub genres: Option<Vec<JikanGenre>>,
    pub explicit_genres: Option<Vec<JikanGenre>>,
    pub published: Option<JikanAired>,
    pub status: Option<String>,
}

impl JikanManga {
    pub fn get_aired(&self) -> Option<String> {
        self.published.as_ref().and_then(|p| p.string.clone())
    }

    pub fn get_rating(&self) -> Option<String> {
        let mut names = Vec::new();
        if let Some(genres) = &self.genres {
            names.extend(genres.iter().map(|g| g.name.as_str()));
        }
        if let Some(genres) = &self.explicit_genres {
            names.extend(genres.iter().map(|g| g.name.as_str()));
        }

        if names.iter().any(|&name| name == "Hentai") {
            return Some("Rx - Hentai".to_string());
        }
        if names.iter().any(|&name| name == "Ecchi") {
            return Some("R+ - Mild Nudity".to_string());
        }

        None
    }

    pub fn get_image_url(&self) -> Option<String> {
        self.images.as_ref().and_then(|img| {
            if let Some(jpg) = &img.jpg {
                if jpg.large_image_url.is_some() {
                    return jpg.large_image_url.clone();
                }
                if jpg.image_url.is_some() {
                    return jpg.image_url.clone();
                }
            }
            if let Some(webp) = &img.webp {
                if webp.large_image_url.is_some() {
                    return webp.large_image_url.clone();
                }
                if webp.image_url.is_some() {
                    return webp.image_url.clone();
                }
            }
            None
        })
    }
}

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct JikanPaginationItems {
    pub count: i32,
    pub total: i32,
    pub per_page: i32,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct JikanPagination {
    pub last_visible_page: i32,
    pub has_next_page: bool,
    pub current_page: i32,
    pub items: Option<JikanPaginationItems>,
}

#[derive(Debug, Deserialize)]
struct JikanResponse<T> {
    pagination: Option<JikanPagination>,
    data: Vec<T>,
}

pub struct JikanService {
    client: reqwest::Client,
}

impl JikanService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .build()
                .unwrap(),
        }
    }

    async fn fetch_with_retry(&self, url: &str) -> Result<reqwest::Response> {
        let max_retries = 6;
        let mut attempt = 0;
        loop {
            attempt += 1;
            match self.client.get(url).send().await {
                Ok(response) => {
                    let status = response.status();
                    if status == 429 || status == 504 || status == 502 || status == 503 || status == 500 {
                        if attempt <= max_retries {
                            let delay_ms = attempt as u64 * 2500;
                            eprintln!(
                                "[JikanService] HTTP {} for {}. Retrying in {}ms (attempt {}/{})",
                                status, url, delay_ms, attempt, max_retries
                            );
                            tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                            continue;
                        }
                    }
                    return Ok(response);
                }
                Err(e) => {
                    if attempt <= max_retries {
                        let delay_ms = attempt as u64 * 2500;
                        eprintln!(
                            "[JikanService] Request error for {}: {}. Retrying in {}ms (attempt {}/{})",
                            url, e, delay_ms, attempt, max_retries
                        );
                        tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                        continue;
                    }
                    return Err(e.into());
                }
            }
        }
    }

    pub async fn get_current_season_anime(&self, page: i32) -> Result<(Vec<JikanAnime>, Option<JikanPagination>)> {
        let url = format!("https://api.jikan.moe/v4/seasons/now?page={}", page);
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        let resp = response.json::<JikanResponse<JikanAnime>>().await?;
        Ok((resp.data, resp.pagination))
    }

    pub async fn get_upcoming_season_anime(&self, page: i32) -> Result<(Vec<JikanAnime>, Option<JikanPagination>)> {
        let url = format!("https://api.jikan.moe/v4/seasons/upcoming?page={}", page);
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        let resp = response.json::<JikanResponse<JikanAnime>>().await?;
        Ok((resp.data, resp.pagination))
    }

    pub async fn get_top_anime(&self, page: i32) -> Result<(Vec<JikanAnime>, Option<JikanPagination>)> {
        let url = format!("https://api.jikan.moe/v4/top/anime?page={}", page);
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        let resp = response.json::<JikanResponse<JikanAnime>>().await?;
        Ok((resp.data, resp.pagination))
    }

    pub async fn get_top_manga(&self, page: i32) -> Result<Vec<JikanManga>> {
        let url = format!("https://api.jikan.moe/v4/top/manga?page={}", page);
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        let resp = response.json::<JikanResponse<JikanManga>>().await?;
        Ok(resp.data)
    }

    pub async fn search_anime(&self, title: &str) -> Result<Option<JikanAnime>> {
        let url = format!(
            "https://api.jikan.moe/v4/anime?q={}&limit=1",
            urlencoding::encode(title)
        );
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        let resp = response.json::<JikanResponse<JikanAnime>>().await?;
        Ok(resp.data.into_iter().next())
    }

    pub async fn search_manga(&self, title: &str) -> Result<Option<JikanManga>> {
        let url = format!(
            "https://api.jikan.moe/v4/manga?q={}&limit=1",
            urlencoding::encode(title)
        );
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        let resp = response.json::<JikanResponse<JikanManga>>().await?;
        Ok(resp.data.into_iter().next())
    }

    pub async fn get_anime_by_id(&self, mal_id: i32) -> Result<Option<JikanAnime>> {
        let url = format!("https://api.jikan.moe/v4/anime/{}", mal_id);
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        #[derive(Deserialize)]
        struct SingleResponse<T> {
            data: T,
        }

        let resp = response.json::<SingleResponse<JikanAnime>>().await?;
        Ok(Some(resp.data))
    }

    pub async fn get_anime_relations(&self, mal_id: i32) -> Result<Vec<JikanRelation>> {
        let url = format!("https://api.jikan.moe/v4/anime/{}/relations", mal_id);
        let response = self.fetch_with_retry(&url).await?;

        if response.status() == 429 {
            return Err(anyhow::anyhow!("Rate limited by Jikan"));
        }

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Jikan API returned status {}",
                response.status()
            ));
        }

        #[derive(Deserialize)]
        struct RelationsResponse {
            data: Vec<JikanRelation>,
        }

        let resp = response.json::<RelationsResponse>().await?;
        Ok(resp.data)
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanRelationEntry {
    pub mal_id: i32,
    #[allow(dead_code)]
    pub name: String,
    #[serde(rename = "type")]
    pub entry_type: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JikanRelation {
    pub relation: String,
    pub entry: Vec<JikanRelationEntry>,
}


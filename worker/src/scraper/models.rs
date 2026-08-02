use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ScrapedEpisode {
    pub season_number: i32,
    pub number: i32,
    pub title: Option<String>,
    pub url: String,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScrapedMedia {
    pub title: String,
    pub image_url: Option<String>,
    pub episodes: Vec<ScrapedEpisode>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScrapedChapter {
    pub number: f32,
    pub title: Option<String>,
    pub pages: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScrapedManga {
    pub title: String,
    pub image_url: Option<String>,
    pub chapters: Vec<ScrapedChapter>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiscoveryItem {
    pub title: String,
    pub image_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScrapedChannel {
    pub title: String,
    pub image_url: Option<String>,
    pub video_url: String,
}

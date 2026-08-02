use anyhow::Result;
use serde::Deserialize;
use std::env;

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct TmdbGenre {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct TmdbReleaseDateItem {
    pub certification: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct TmdbReleaseCountryResult {
    pub iso_3166_1: String,
    pub release_dates: Vec<TmdbReleaseDateItem>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct TmdbReleaseDatesResponse {
    pub results: Vec<TmdbReleaseCountryResult>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct TmdbMovieDetail {
    pub id: i32,
    pub title: String,
    pub overview: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub genres: Option<Vec<TmdbGenre>>,
    pub release_date: Option<String>,
    pub vote_average: Option<f32>,
    pub release_dates: Option<TmdbReleaseDatesResponse>,
}

impl TmdbMovieDetail {
    pub fn get_image_url(&self) -> Option<String> {
        self.poster_path.as_ref().map(|path| format!("https://image.tmdb.org/t/p/w500{}", path))
    }

    pub fn get_rating(&self) -> Option<String> {
        if let Some(ref rd) = self.release_dates {
            // First check if there is a BR certification
            if let Some(br_res) = rd.results.iter().find(|r| r.iso_3166_1 == "BR") {
                if let Some(item) = br_res.release_dates.iter().find(|d| !d.certification.is_empty()) {
                    return Some(item.certification.clone());
                }
            }
            // Fall back to US certification
            if let Some(us_res) = rd.results.iter().find(|r| r.iso_3166_1 == "US") {
                if let Some(item) = us_res.release_dates.iter().find(|d| !d.certification.is_empty()) {
                    return Some(item.certification.clone());
                }
            }
            // Fall back to any non-empty certification
            for res in &rd.results {
                for item in &res.release_dates {
                    if !item.certification.is_empty() {
                        return Some(item.certification.clone());
                    }
                }
            }
        }
        None
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct TmdbContentRatingItem {
    pub iso_3166_1: String,
    pub rating: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct TmdbContentRatingsResponse {
    pub results: Vec<TmdbContentRatingItem>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct TmdbSeasonItem {
    pub id: i32,
    pub season_number: i32,
    pub episode_count: i32,
    pub name: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize, Clone)]
pub struct TmdbSeriesDetail {
    pub id: i32,
    pub name: String,
    pub overview: Option<String>,
    pub poster_path: Option<String>,
    pub backdrop_path: Option<String>,
    pub genres: Option<Vec<TmdbGenre>>,
    pub first_air_date: Option<String>,
    pub vote_average: Option<f32>,
    pub content_ratings: Option<TmdbContentRatingsResponse>,
    pub seasons: Option<Vec<TmdbSeasonItem>>,
}

impl TmdbSeriesDetail {
    #[allow(dead_code)]
    pub fn get_image_url(&self) -> Option<String> {
        self.poster_path.as_ref().map(|path| format!("https://image.tmdb.org/t/p/w500{}", path))
    }

    pub fn get_year(&self) -> Option<i32> {
        self.first_air_date.as_ref().and_then(|date| {
            date.split('-').next().and_then(|year_str| year_str.parse::<i32>().ok())
        })
    }

    pub fn get_rating(&self) -> Option<String> {
        if let Some(ref cr) = self.content_ratings {
            // First check if there is a BR rating
            if let Some(br_res) = cr.results.iter().find(|r| r.iso_3166_1 == "BR") {
                if !br_res.rating.is_empty() {
                    return Some(br_res.rating.clone());
                }
            }
            // Fall back to US rating
            if let Some(us_res) = cr.results.iter().find(|r| r.iso_3166_1 == "US") {
                if !us_res.rating.is_empty() {
                    return Some(us_res.rating.clone());
                }
            }
            // Fall back to any non-empty rating
            for res in &cr.results {
                if !res.rating.is_empty() {
                    return Some(res.rating.clone());
                }
            }
        }
        None
    }
}

#[derive(Debug, Deserialize)]
struct TmdbSearchResponse {
    pub results: Vec<TmdbSearchResult>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbPopularMoviesResponse {
    pub results: Vec<TmdbMovieDetail>,
}

#[derive(Debug, Deserialize)]
pub struct TmdbPopularSeriesResponse {
    pub results: Vec<TmdbSeriesDetail>,
}

#[derive(Debug, Deserialize)]
struct TmdbSearchResult {
    pub id: i32,
}

pub struct TmdbService {
    client: reqwest::Client,
    api_key: Option<String>,
    read_access_token: Option<String>,
}

impl TmdbService {
    pub fn new() -> Self {
        let api_key = env::var("TMDB_API_KEY").ok();
        let read_access_token = env::var("TMDB_API_READ_ACCESS_TOKEN").ok();
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .build()
                .unwrap(),
            api_key,
            read_access_token,
        }
    }

    pub async fn search_movie(&self, title: &str) -> Result<Option<TmdbMovieDetail>> {
        // We need at least one of the API credentials to perform the request
        if self.api_key.is_none() && self.read_access_token.is_none() {
            println!("Warning: TMDB API credentials not set in environment.");
            return Ok(None);
        }

        // 1. Search for the movie to get its ID
        let search_url = format!(
            "https://api.themoviedb.org/3/search/movie?query={}&language=pt-BR",
            urlencoding::encode(title)
        );

        let mut req = self.client.get(&search_url);
        if let Some(ref token) = self.read_access_token {
            req = req.bearer_auth(token);
        } else if let Some(ref key) = self.api_key {
            req = req.query(&[("api_key", key)]);
        }

        let response = req.send().await?;
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "TMDB Search API returned status {}",
                response.status()
            ));
        }

        let search_result = response.json::<TmdbSearchResponse>().await?;
        if let Some(first_match) = search_result.results.first() {
            let movie_id = first_match.id;

            // 2. Fetch full details including release dates for this movie ID
            let detail_url = format!(
                "https://api.themoviedb.org/3/movie/{}?language=pt-BR&append_to_response=release_dates",
                movie_id
            );

            let mut detail_req = self.client.get(&detail_url);
            if let Some(ref token) = self.read_access_token {
                detail_req = detail_req.bearer_auth(token);
            } else if let Some(ref key) = self.api_key {
                detail_req = detail_req.query(&[("api_key", key)]);
            }

            let detail_response = detail_req.send().await?;
            if !detail_response.status().is_success() {
                return Err(anyhow::anyhow!(
                    "TMDB Detail API returned status {}",
                    detail_response.status()
                ));
            }

            let movie_detail = detail_response.json::<TmdbMovieDetail>().await?;
            return Ok(Some(movie_detail));
        }

        Ok(None)
    }

    pub async fn search_series(&self, title: &str) -> Result<Option<TmdbSeriesDetail>> {
        // We need at least one of the API credentials to perform the request
        if self.api_key.is_none() && self.read_access_token.is_none() {
            println!("Warning: TMDB API credentials not set in environment.");
            return Ok(None);
        }

        // 1. Search for the series to get its ID
        let search_url = format!(
            "https://api.themoviedb.org/3/search/tv?query={}&language=pt-BR",
            urlencoding::encode(title)
        );

        let mut req = self.client.get(&search_url);
        if let Some(ref token) = self.read_access_token {
            req = req.bearer_auth(token);
        } else if let Some(ref key) = self.api_key {
            req = req.query(&[("api_key", key)]);
        }

        let response = req.send().await?;
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "TMDB Series Search API returned status {}",
                response.status()
            ));
        }

        let search_result = response.json::<TmdbSearchResponse>().await?;
        if let Some(first_match) = search_result.results.first() {
            let series_id = first_match.id;

            // 2. Fetch full details including content ratings for this series ID
            let detail_url = format!(
                "https://api.themoviedb.org/3/tv/{}?language=pt-BR&append_to_response=content_ratings",
                series_id
            );

            let mut detail_req = self.client.get(&detail_url);
            if let Some(ref token) = self.read_access_token {
                detail_req = detail_req.bearer_auth(token);
            } else if let Some(ref key) = self.api_key {
                detail_req = detail_req.query(&[("api_key", key)]);
            }

            let detail_response = detail_req.send().await?;
            if !detail_response.status().is_success() {
                return Err(anyhow::anyhow!(
                    "TMDB Series Detail API returned status {}",
                    detail_response.status()
                ));
            }

            let series_detail = detail_response.json::<TmdbSeriesDetail>().await?;
            return Ok(Some(series_detail));
        }

        Ok(None)
    }

    pub async fn get_popular_movies(&self, page: i32) -> Result<Vec<TmdbMovieDetail>> {
        if self.api_key.is_none() && self.read_access_token.is_none() {
            println!("Warning: TMDB API credentials not set in environment.");
            return Ok(Vec::new());
        }

        let url = format!(
            "https://api.themoviedb.org/3/movie/popular?language=pt-BR&page={}",
            page
        );

        let mut req = self.client.get(&url);
        if let Some(ref token) = self.read_access_token {
            req = req.bearer_auth(token);
        } else if let Some(ref key) = self.api_key {
            req = req.query(&[("api_key", key)]);
        }

        let response = req.send().await?;
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "TMDB Popular Movies API returned status {}",
                response.status()
            ));
        }

        let result = response.json::<TmdbPopularMoviesResponse>().await?;
        Ok(result.results)
    }

    pub async fn get_popular_series(&self, page: i32) -> Result<Vec<TmdbSeriesDetail>> {
        if self.api_key.is_none() && self.read_access_token.is_none() {
            println!("Warning: TMDB API credentials not set in environment.");
            return Ok(Vec::new());
        }

        let url = format!(
            "https://api.themoviedb.org/3/tv/popular?language=pt-BR&page={}",
            page
        );

        let mut req = self.client.get(&url);
        if let Some(ref token) = self.read_access_token {
            req = req.bearer_auth(token);
        } else if let Some(ref key) = self.api_key {
            req = req.query(&[("api_key", key)]);
        }

        let response = req.send().await?;
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "TMDB Popular Series API returned status {}",
                response.status()
            ));
        }

        let result = response.json::<TmdbPopularSeriesResponse>().await?;
        Ok(result.results)
    }
}

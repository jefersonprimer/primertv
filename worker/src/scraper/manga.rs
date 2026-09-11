use super::models::{ScrapedChapter, ScrapedManga};
use anyhow::Result;
use scraper::{Html, Selector};

pub struct MangaScraper {
    client: reqwest::Client,
    sources: Vec<&'static str>,
}

impl MangaScraper {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
            sources: vec![
                "https://mangalivre.to",
                "https://mangalivre.blog",
                "https://mangaonline.blue",
                "https://sakuramangas.org",
                "https://taiyo.moe",
                "https://toonlivre.net",
                "https://atsu.moe",
                "https://comix.to",
                "https://mangafire.to",
                "https://silentquill.net",
                "https://asurascans.com",
                "https://comikey.com",
            ],
        }
    }

    fn normalize_title(&self, title: &str) -> String {
        let mut clean = title.to_lowercase();
        // Remove content after common separators
        if let Some(pos) = clean.find(" - ") {
            clean = clean[..pos].to_string();
        }
        if let Some(pos) = clean.find(" : ") {
            clean = clean[..pos].to_string();
        }
        if let Some(pos) = clean.find(':') {
            clean = clean[..pos].to_string();
        }
        if let Some(pos) = clean.find('(') {
            clean = clean[..pos].to_string();
        }
        clean.trim().to_string()
    }

    pub async fn scrape(&self, title: &str) -> Result<Option<ScrapedManga>> {
        let titles_to_try = if title.contains(" - ")
            || title.contains(" : ")
            || title.contains(':')
            || title.contains('(')
        {
            vec![title.to_string(), self.normalize_title(title)]
        } else {
            vec![title.to_string()]
        };

        for t in &titles_to_try {
            if t.is_empty() {
                continue;
            }
            for source in &self.sources {
                println!("Trying source: {} for manga: {}", source, t);
                let result = self.scrape_wp_manga(source, t).await;

                if let Ok(Some(manga)) = result {
                    println!(
                        "SUCCESS: Found {} chapters on {}",
                        manga.chapters.len(),
                        source
                    );
                    return Ok(Some(manga));
                }
            }
        }
        Ok(None)
    }

    fn extract_chapter_number(&self, url: &str, text: &str) -> f32 {
        // 1. Try to find a pattern like "capitulo-X-Y" or "capitulo-X" or "chapter/X" in the URL segments
        for segment in url.split('/') {
            if segment.contains("capitulo-") {
                let clean = segment.replace("capitulo-", "");
                let parts: Vec<&str> = clean.split('-').collect();
                if !parts.is_empty() {
                    if let Ok(num) = parts[0].parse::<f32>() {
                        if parts.len() > 1 {
                            if let Ok(_decimal) = parts[1].parse::<f32>() {
                                if parts[1].chars().all(|c| c.is_digit(10)) {
                                    let combined = format!("{}.{}", parts[0], parts[1]);
                                    if let Ok(comb_num) = combined.parse::<f32>() {
                                        return comb_num;
                                    }
                                }
                            }
                        }
                        return num;
                    }
                }
            }
        }

        // 2. Try to extract from text: look for a number in the alphanumeric segments
        let normalized_text = text.to_lowercase();
        for word in normalized_text.split(|c: char| !c.is_alphanumeric() && c != '.' && c != '-') {
            let clean_word: String = word
                .chars()
                .filter(|c| c.is_digit(10) || *c == '.' || *c == ',')
                .collect();
            let clean_word = clean_word.replace(',', ".");
            if let Ok(num) = clean_word.parse::<f32>() {
                return num;
            }
        }

        // Fallback: extract all digits and dots/commas
        let digits_only: String = text
            .chars()
            .filter(|c| c.is_digit(10) || *c == '.' || *c == ',')
            .collect();
        let digits_only = digits_only.replace(',', ".");
        digits_only.parse::<f32>().unwrap_or(0.0)
    }

    async fn scrape_wp_manga(&self, base_url: &str, title: &str) -> Result<Option<ScrapedManga>> {
        let encoded_title = urlencoding::encode(title);
        let search_url = if base_url.contains("mangaonline.blue") {
            format!("{}/?s={}", base_url, encoded_title)
        } else if base_url.contains("asurascans.com") {
            format!("{}/browse?search={}", base_url, encoded_title)
        } else if base_url.contains("silentquill.net") {
            format!("{}/search/?q={}", base_url, encoded_title)
        } else if base_url.contains("atsu.moe") || base_url.contains("taiyo.moe") {
            format!("{}/explore?search={}", base_url, encoded_title)
        } else if base_url.contains("comix.to") {
            format!("{}/browse?q={}&sort=relevance%3Adesc", base_url, encoded_title)
        } else if base_url.contains("mangafire.to") {
            format!("{}/browse?keyword={}&sort=relevance:desc", base_url, encoded_title)
        } else if base_url.contains("comikey.com") {
            format!("{}/comics/?q={}&lang_eng=on", base_url, encoded_title)
        } else {
            format!(
                "{}/?s={}&post_type=wp-manga",
                base_url,
                encoded_title
            )
        };

        let response = match self.client.get(&search_url).send().await {
            Ok(res) => match res.text().await {
                Ok(text) => text,
                Err(_) => return Ok(None),
            },
            Err(_) => return Ok(None),
        };
        let document = Html::parse_document(&response);

        let link_selector = Selector::parse(".post-title h3 a, .post-title a, .manga-card-link, .manga-card a, .result-item .details .title a, a[href*=\"/comics/\"], a[href*=\"/series/\"], a[href*=\"/manga/\"], a[href*=\"/title/\"], a[href*=\"/media/\"]").unwrap();

        if let Some(link) = document.select(&link_selector).next() {
            let mut manga_url = link.value().attr("href").unwrap_or_default().to_string();
            if manga_url.starts_with('/') {
                manga_url = format!("{}{}", base_url.trim_end_matches('/'), manga_url);
            }

            let title_selector = Selector::parse(".manga-card-title, .post-title, h3.manga-card-title, .result-item .details .title a, h1, .entry-title").unwrap();
            let manga_title = if let Some(title_el) = document.select(&title_selector).next() {
                title_el.text().collect::<String>().trim().to_string()
            } else {
                link.text().collect::<String>().trim().to_string()
            };

            let image_selector = Selector::parse(".tab-thumb img, .post-thumb img, .manga-cover-img, .manga-card-image img, .img-responsive, .result-item .image img, img[src*=\"cover\"], img[src*=\"poster\"], img[src*=\"uploads\"]").unwrap();
            let image_url = document
                .select(&image_selector)
                .next()
                .and_then(|img| {
                    img.value()
                        .attr("src")
                        .or_else(|| img.value().attr("data-src"))
                })
                .map(|s| s.to_string());

            let mut chapter_page = match self.client.get(&manga_url).send().await {
                Ok(res) => res.text().await.unwrap_or_default(),
                Err(_) => String::new(),
            };
            let mut chapter_doc = Html::parse_document(&chapter_page);
            let chapter_selector = Selector::parse("li.wp-manga-chapter a, .chapter-link, .chapter-grid-link, .chapter-box a, .wp-manga-chapter a, .list-chapters .chapter a, a[href*=\"/chapter/\"], a[href*=\"-chapter-\"], a[href*=\"-ch-\"]").unwrap();

            let mut chapters_elements: Vec<_> = chapter_doc.select(&chapter_selector).collect();

            // If no chapters found directly, try the AJAX endpoint
            if chapters_elements.is_empty() {
                let ajax_url = format!("{}/ajax/chapters/", manga_url.trim_end_matches('/'));
                if let Ok(resp) = self.client.post(&ajax_url).send().await {
                    if let Ok(html) = resp.text().await {
                        chapter_page = html;
                        chapter_doc = Html::parse_document(&chapter_page);
                        chapters_elements = chapter_doc.select(&chapter_selector).collect();
                    }
                }
            }

            let mut chapters = Vec::new();
            let mut seen_numbers = std::collections::HashSet::new();

            for chap_link in chapters_elements {
                let mut chap_url = chap_link
                    .value()
                    .attr("href")
                    .unwrap_or_default()
                    .to_string();
                if chap_url.is_empty() {
                    continue;
                }
                if chap_url.starts_with('/') {
                    chap_url = format!("{}{}", base_url.trim_end_matches('/'), chap_url);
                }
                let chap_text = chap_link.text().collect::<String>();

                let number = self.extract_chapter_number(&chap_url, &chap_text);
                let number_key = (number * 100.0).round() as i32;
                if seen_numbers.contains(&number_key) {
                    continue;
                }
                seen_numbers.insert(number_key);

                if let Ok(pages_page) = self.client.get(&chap_url).send().await {
                    if let Ok(html) = pages_page.text().await {
                        let pages_doc = Html::parse_document(&html);
                        let img_selector = Selector::parse(".reading-content img, .images-container img, #images-container img, .wp-manga-chapter-img, .chapter-image, .chapter-image-container img, img[src*=\"asura-images\"], img[src*=\"chapters\"], .reader-images img, #reader img").unwrap();
                        let pages = pages_doc
                            .select(&img_selector)
                            .filter_map(|img| {
                                img.value()
                                    .attr("src")
                                    .or_else(|| img.value().attr("data-src"))
                            })
                            .map(|s| s.trim().to_string())
                            .filter(|s| {
                                !s.is_empty() && (s.starts_with("http") || s.starts_with("//"))
                            })
                            .collect::<Vec<_>>();

                        if !pages.is_empty() {
                            chapters.push(ScrapedChapter {
                                number,
                                title: Some(chap_text.trim().to_string()),
                                pages,
                            });
                        }
                    }
                }
            }

            if chapters.is_empty() {
                return Ok(None);
            }

            // Sort chapters by number ascending
            chapters.sort_by(|a, b| {
                a.number
                    .partial_cmp(&b.number)
                    .unwrap_or(std::cmp::Ordering::Equal)
            });

            return Ok(Some(ScrapedManga {
                title: manga_title,
                image_url,
                chapters,
            }));
        }
        Ok(None)
    }
}


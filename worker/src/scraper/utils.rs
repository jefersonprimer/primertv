use scraper::{Html, Selector};
use std::collections::HashSet;
use base64::{Engine as _, engine::general_purpose};

pub async fn resolve_video_url(client: &reqwest::Client, ep_url: &str) -> Option<String> {
    println!("[resolve_video_url] Starting with: {}", ep_url);
    if ep_url.contains("youtube.com") || ep_url.contains("youtu.be") || ep_url.contains("filemoon") {
        println!("[resolve_video_url] Ignoring YouTube/Filemoon link: {}", ep_url);
        return None;
    }
    let mut visited = HashSet::new();
    let normalized = match normalize_url(ep_url, None) {
        Some(url) => url,
        None => {
            println!("[resolve_video_url] Failed to normalize: {}", ep_url);
            return None;
        }
    };

    resolve_video_url_recursive(client, normalized, &mut visited, 0).await
}

fn resolve_video_url_recursive<'a>(
    client: &'a reqwest::Client,
    url: String,
    visited: &'a mut HashSet<String>,
    depth: i32,
) -> futures::future::BoxFuture<'a, Option<String>> {
    use futures::future::FutureExt;
    async move {
        if depth >= 3 {
            return None;
        }

        if !visited.insert(url.clone()) {
            return None;
        }

        if is_direct_media_url(&url) {
            println!("[resolve_video_url] Found direct media URL at depth {}: {}", depth, url);
            return Some(url);
        }

        println!("[resolve_video_url] Fetching at depth {}: {}", depth, url);
        let html = match fetch_html(client, &url).await {
            Some(h) => h,
            None => return None,
        };

        let mut candidates = extract_candidates(&html, &url);
        let doo_play_candidates = extract_doo_play_candidates(client, &html, &url).await;
        candidates.extend(doo_play_candidates);

        candidates.retain(|candidate| !candidate.is_empty());
        candidates.sort();
        candidates.dedup();

        // Prioritize direct media URLs in the candidates list
        if let Some(direct_media) = candidates.iter().find(|candidate| is_direct_media_url(candidate)) {
            println!("[resolve_video_url] Found direct media in candidates at depth {}: {}", depth, direct_media);
            return Some(direct_media.clone());
        }

        // Try to resolve each candidate recursively (backtracking if one fails)
        for candidate in candidates {
            if !visited.contains(&candidate) {
                println!("[resolve_video_url] Trying candidate at depth {}: {}", depth + 1, candidate);
                if let Some(resolved) = resolve_video_url_recursive(client, candidate, visited, depth + 1).await {
                    return Some(resolved);
                }
            }
        }

        None
    }
    .boxed()
}

async fn fetch_html(client: &reqwest::Client, url: &str) -> Option<String> {
    let mut builder = client.get(url);
    if url.contains("painelpsn.novefx.biz") {
        builder = builder.header("Referer", "https://cozinhandocomigo.com");
    } else if url.contains("painel") {
        builder = builder.header("Referer", "https://esportesdavez.com");
    } else if url.contains("rogeriobetin.com") {
        builder = builder.header("Referer", "https://topanimes.net/");
    }

    match builder.send().await {
        Ok(resp) => resp.text().await.ok(),
        Err(e) => {
            eprintln!("Error resolving video URL for {}: {}", url, e);
            None
        }
    }
}

pub fn extract_candidates(html: &str, base_url: &str) -> Vec<String> {
    let doc = Html::parse_document(html);
    let selectors = [
        "iframe.metaframe",
        ".video-player iframe",
        "#player_embed iframe",
        "#video_player iframe",
        ".player-embed iframe",
        "iframe[src*='painel']",
        "iframe[src*='embed']",
        "iframe[src*='player']",
        "iframe",
        "video source[src*='.mp4']",
        "video source[src*='.m3u8']",
        "video source",
        "source[src*='.mp4']",
        "source[src*='.m3u8']",
        "source",
        "video",
        "a[href*='.mp4']",
        "a[href*='.m3u8']",
        "button",
        "button[data-source]",
        "[data-source]",
        "[data-video]",
        "[data-link]",
    ];

    let attributes = [
        "src",
        "data-src",
        "data-lazy-src",
        "data-litespeed-src",
        "data-orig-src",
        "href",
        "content",
        "data-source",
        "data-video",
        "data-link",
        "data-href",
    ];

    let mut candidates = Vec::new();

    for selector_str in selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in doc.select(&selector) {
                for attr in attributes {
                    if let Some(value) = element.value().attr(attr) {
                        if let Some(normalized) = normalize_url(value, Some(base_url)) {
                            if !normalized.contains("wp-admin")
                                && !normalized.contains("google-analytics")
                                && !normalized.contains("ads")
                                && !normalized.contains("youtube.com")
                                && !normalized.contains("youtu.be")
                                && !normalized.contains("filemoon")
                                && normalized != base_url
                            {
                                candidates.push(normalized);
                            }
                        }
                    }
                }
            }
        }
    }

    let script_selector = Selector::parse("script").unwrap();
    let patterns = [
        r#"['"`]?\s*(?:file|url|src)\s*['"`]?\s*:\s*['"`]([^'"`\s]+)['"`]"#,
    ];

    for script in doc.select(&script_selector) {
        let mut content = script.inner_html();
        if content.contains("eval(function(p,a,c,k,e,") {
            println!("[extract_candidates] Found eval packed script in html, length = {}", content.len());
            if let Some(unpacked) = unpack_dean_edwards(&content) {
                println!("[extract_candidates] Successfully unpacked script. Unpacked length = {}", unpacked.len());
                content = unpacked;
            } else {
                println!("[extract_candidates] Unpacking Dean Edwards failed!");
            }
        }

        let content = content.replace("\\'", "'").replace("\\\"", "\"").replace("\\/", "/");

        for pattern in patterns {
            if let Ok(re) = regex::Regex::new(pattern) {
                for cap in re.captures_iter(&content) {
                    if let Some(normalized) = normalize_url(&cap[1], Some(base_url)) {
                        if !normalized.contains("wp-admin")
                            && !normalized.contains("google-analytics")
                            && !normalized.contains("ads")
                            && !normalized.contains("youtube.com")
                            && !normalized.contains("youtu.be")
                            && !normalized.contains("filemoon")
                            && normalized != base_url
                        {
                            candidates.push(normalized);
                        }
                    }
                }
            }
        }
    }

    candidates
}

pub async fn extract_doo_play_candidates(
    client: &reqwest::Client,
    html: &str,
    base_url: &str,
) -> Vec<String> {
    let mut candidates = Vec::new();
    let mut params_to_fetch = Vec::new();
    
    {
        let doc = Html::parse_document(html);
        let doo_selector = Selector::parse(".dooplay_player_option").ok();
        
        if let Some(selector) = doo_selector {
            for option in doc.select(&selector) {
                let post = option.value().attr("data-post").unwrap_or("").to_string();
                let nume = option.value().attr("data-nume").unwrap_or("").to_string();
                let type_attr = option.value().attr("data-type").unwrap_or("").to_string();

                if !post.is_empty() && !nume.is_empty() {
                    params_to_fetch.push((post, nume, type_attr));
                }
            }
        }
    }

    for (post, nume, type_attr) in params_to_fetch {
        if let Ok(parsed_url) = reqwest::Url::parse(base_url) {
            let ajax_url = format!(
                "{}://{}/wp-admin/admin-ajax.php",
                parsed_url.scheme(),
                parsed_url.host_str().unwrap_or("")
            );

            let mut params = std::collections::HashMap::new();
            params.insert("action", "doo_player_ajax");
            params.insert("post", post.as_str());
            params.insert("nume", nume.as_str());
            params.insert("type", type_attr.as_str());

            match client
                .post(&ajax_url)
                .form(&params)
                .header("Referer", base_url)
                .header("X-Requested-With", "XMLHttpRequest")
                .send()
                .await
            {
                Ok(ajax_resp) => {
                    let status = ajax_resp.status();
                    let text = ajax_resp.text().await.unwrap_or_default();
                    println!("Ajax response status for post {} (nume {}): {}. Body: {}", post, nume, status, text);
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                        if let Some(embed_url) = json["embed_url"].as_str() {
                            // embed_url can be an iframe tag or a direct URL
                            if embed_url.contains("<iframe") {
                                if let Some(src) = extract_src_from_iframe(embed_url) {
                                    if let Some(normalized) = normalize_url(&src, Some(base_url)) {
                                        candidates.push(normalized);
                                    }
                                }
                            } else if let Some(normalized) = normalize_url(embed_url, Some(base_url)) {
                                candidates.push(normalized);
                            }
                        }
                    }
                }
                Err(e) => {
                    println!("Ajax request error for post {}: {}", post, e);
                }
            }
        }
    }

    candidates
}

fn extract_src_from_iframe(html: &str) -> Option<String> {
    let re = regex::Regex::new(r#"src\s*=\s*["']([^"']+)["']"#).ok()?;
    re.captures(html).map(|cap| cap[1].to_string())
}

fn is_direct_media_url(url: &str) -> bool {
    let lower_url = url.to_lowercase();
    if lower_url.contains("youtube.com") || lower_url.contains("youtu.be") || lower_url.contains("filemoon") {
        return false;
    }
    let path = reqwest::Url::parse(url)
        .map(|parsed| parsed.path().to_lowercase())
        .unwrap_or_else(|_| url.split('?').next().unwrap_or(url).to_lowercase());

    path.ends_with(".mp4")
        || path.ends_with(".m3u8")
        || path.ends_with(".webm")
        || path.ends_with(".ogg")
        || lower_url.contains("anidrive.click")
        || lower_url.contains("megacloud.tv/embed")
        || lower_url.contains("rapidcloud.cc/embed")
        || lower_url.contains("blogger.com/video.g")
        || lower_url.contains("ok.ru/videoembed")
        || lower_url.contains("vidoza.net/embed")
        || lower_url.contains("streamtape.com/e/")
        || lower_url.contains("fembed.com/v/")
        || lower_url.contains("upstream.to/embed")
        || lower_url.contains("dood.to/e/")
        || lower_url.contains("doodstream.com/e/")
        || lower_url.contains("voe.sx/e/")
        || lower_url.contains("vidmoly.to/embed")
        || lower_url.contains("mixdrop.co/e/")
        || lower_url.contains("evoload.io/e/")
        || lower_url.contains("wolfstream.tv/embed")
        || lower_url.contains("/embed/")
        || lower_url.contains("player.php")
        || lower_url.contains("embed.php")
        || lower_url.contains("embedplay")
        || lower_url.contains("playembed")
        || lower_url.contains("upns.xyz")
        || lower_url.contains("byse.top")
        || lower_url.contains("csst.online")
        || lower_url.contains("embedwish.com/e/")
        || lower_url.contains("streamwish")
}

fn normalize_url(url: &str, base_url: Option<&str>) -> Option<String> {
    let mut trimmed = url.trim().replace("&amp;", "&").replace("\\/", "/");
    if trimmed.is_empty()
        || trimmed.starts_with("javascript:")
        || trimmed.starts_with("data:")
        || trimmed.starts_with("document.")
    {
        return None;
    }

    if let Some(special) = normalize_special_urls(&trimmed) {
        trimmed = special;
    }

    if trimmed.starts_with("//") {
        if trimmed.len() < 5 || !trimmed[2..].contains('.') {
            return None;
        }
        return Some(format!("https:{}", trimmed));
    }

    if let Some(base) = base_url {
        if let Ok(base_parsed) = reqwest::Url::parse(base) {
            if let Ok(joined) = base_parsed.join(&trimmed) {
                let mut joined_str = joined.to_string();
                if let Some(special) = normalize_special_urls(&joined_str) {
                    joined_str = special;
                }
                return Some(joined_str);
            }
        }
    }

    let mut final_url = reqwest::Url::parse(&trimmed).map(|url| url.to_string()).ok();
    if let Some(ref mut u) = final_url {
        if let Some(special) = normalize_special_urls(u) {
            *u = special;
        }
    }
    final_url
}

pub fn normalize_special_urls(url: &str) -> Option<String> {
    // 1. v.php?video=
    if let Some(pos) = url.find("v.php?video=") {
        let encoded_video = &url[pos + "v.php?video=".len()..];
        let end_pos = encoded_video.find('&').unwrap_or(encoded_video.len());
        if let Ok(decoded) = urlencoding::decode(&encoded_video[..end_pos]) {
            return Some(decoded.into_owned());
        }
    }

    // 2. safelink_redirect=
    if let Some(pos) = url.find("safelink_redirect=") {
        let base64_part = &url[pos + "safelink_redirect=".len()..];
        let end_pos = base64_part.find('&').unwrap_or(base64_part.len());
        let encoded = &base64_part[..end_pos];
        if let Ok(decoded_str) = urlencoding::decode(encoded) {
            if let Ok(decoded_bytes) = general_purpose::STANDARD.decode(decoded_str.as_ref()) {
                if let Ok(json) = serde_json::from_slice::<serde_json::Value>(&decoded_bytes) {
                    if let Some(safelink) = json["safelink"].as_str() {
                        return Some(safelink.to_string());
                    }
                }
            }
        }
    }

    // 3. aviso/?url=
    if let Some(pos) = url.find("aviso/?url=") {
        let encoded_url = &url[pos + "aviso/?url=".len()..];
        let end_pos = encoded_url.find('&').unwrap_or(encoded_url.len());
        if let Ok(decoded) = urlencoding::decode(&encoded_url[..end_pos]) {
            return Some(decoded.into_owned());
        }
    }

    // 4. aviso.php?url=
    if let Some(pos) = url.find("aviso.php?url=") {
        let encoded_url = &url[pos + "aviso.php?url=".len()..];
        let end_pos = encoded_url.find('&').unwrap_or(encoded_url.len());
        if let Ok(decoded) = urlencoding::decode(&encoded_url[..end_pos]) {
            return Some(decoded.into_owned());
        }
    }

    None
}

pub async fn resolve_embed_url_destination(client: &reqwest::Client, url: &str) -> String {
    let mut current_url = url.to_string();
    let mut visited = HashSet::new();

    for _ in 0..5 {
        if !visited.insert(current_url.clone()) {
            break;
        }

        if let Some(normalized) = normalize_special_urls(&current_url) {
            current_url = normalized;
            continue;
        }

        let html = match fetch_html(client, &current_url).await {
            Some(h) => h,
            None => break,
        };

        let mut next_url = None;
        let doc = Html::parse_document(&html);
        
        let iframe_selector = Selector::parse("iframe").unwrap();
        for iframe in doc.select(&iframe_selector) {
            if let Some(src) = iframe.value().attr("src") {
                if src.contains("safelink_redirect=") {
                    if let Some(normalized) = normalize_url(src, Some(&current_url)) {
                        next_url = Some(normalized);
                        break;
                    }
                }
            }
        }

        if let Some(next) = next_url {
            current_url = next;
            continue;
        }

        break;
    }

    current_url
}

#[derive(Debug, Clone)]
pub struct ScrapedChapter {
    pub season: i32,
    pub number: i32,
    pub title: String,
    pub url: String,
}

pub fn extract_chapters_from_html(html: &str, _base_url: &str) -> Vec<ScrapedChapter> {
    let mut chapters = Vec::new();
    
    // Unpack if packed
    let mut doc_html = html.to_string();
    if doc_html.contains("eval(function(p,a,c,k,e,") {
        if let Some(unpacked) = unpack_dean_edwards(&doc_html) {
            println!("[unpack] Successfully unpacked Dean Edwards script inside extract_chapters_from_html");
            doc_html = unpacked;
        }
    }

    let doc = Html::parse_document(&doc_html);

    // 1. Select option tags
    let option_selector = Selector::parse("select option, select#capitulos option, select#episodios option").unwrap();
    let mut current_season = 1;
    for option in doc.select(&option_selector) {
        let value = option.value().attr("value").unwrap_or("").trim().to_string();
        let text = option.text().collect::<String>().trim().to_string();
        if value.is_empty() {
            continue;
        }

        let upper_text = text.to_uppercase();
        if upper_text.contains("TEMPORADA") || upper_text.contains("SÉRIE") {
            if let Some(pos) = upper_text.find("TEMPORADA") {
                let season_part = &upper_text[pos + "TEMPORADA".len()..];
                if let Some(num) = season_part.chars().filter(|c| c.is_digit(10)).collect::<String>().parse::<i32>().ok() {
                    current_season = num;
                }
            }
            continue;
        }

        if value.starts_with("http://") || value.starts_with("https://") {
            let ep_num = text.chars().filter(|c| c.is_digit(10)).collect::<String>().parse::<i32>().unwrap_or((chapters.len() + 1) as i32);
            chapters.push(ScrapedChapter {
                season: current_season,
                number: ep_num,
                title: text,
                url: value,
            });
        }
    }

    if !chapters.is_empty() {
        return chapters;
    }

    // 2. JavaScript-based chapter lists
    if doc_html.contains("totalChapters") || doc_html.contains("temporadas") || doc_html.contains("chaptersAdded") {
        if let Some(js_chapters) = parse_js_chapters(&doc_html) {
            for ch in js_chapters {
                chapters.push(ch);
            }
        }
    }

    chapters
}

pub fn parse_js_chapters(html: &str) -> Option<Vec<ScrapedChapter>> {
    let url_re = regex::Regex::new(r#"originalUrl\s*=\s*[`'"](https?://[^`'"]+?)(\$\{chapterStr\}|\+?\s*chapterStr)"#).ok()?;
    let url_caps = url_re.captures(html)?;
    let base_pattern = url_caps.get(1)?.as_str();

    let redirect_re = regex::Regex::new(r#"finalUrl\s*=\s*[`'"](https?://[^`'"]+?\?)\$\{encodedUrl\}"#).ok();
    let redirect_prefix = if let Some(ref re) = redirect_re {
        re.captures(html).and_then(|c| c.get(1).map(|m| m.as_str().to_string()))
    } else {
        None
    };

    let mut seasons = Vec::new();
    let temp_re = regex::Regex::new(r#"nome\s*:\s*["']TEMPORADA\s+(\d+)["']\s*,\s*inicio\s*:\s*(\d+)\s*,\s*fim\s*:\s*(\d+)"#).ok()?;
    for caps in temp_re.captures_iter(html) {
        if let (Ok(s), Ok(start), Ok(end)) = (
            caps[1].parse::<i32>(),
            caps[2].parse::<i32>(),
            caps[3].parse::<i32>(),
        ) {
            seasons.push((s, start, end));
        }
    }

    if seasons.is_empty() {
        let total_re = regex::Regex::new(r"totalChapters\s*=\s*(\d+)").ok()?;
        if let Some(caps) = total_re.captures(html) {
            if let Ok(total) = caps[1].parse::<i32>() {
                seasons.push((1, 1, total));
            }
        } else {
            let loop_re = regex::Regex::new(r"chaptersAdded\s*<\s*(\d+)").ok()?;
            if let Some(caps) = loop_re.captures(html) {
                if let Ok(total) = caps[1].parse::<i32>() {
                    seasons.push((1, 1, total));
                }
            }
        }
    }

    if seasons.is_empty() {
        return None;
    }

    let mut result = Vec::new();
    for (season, start, end) in seasons {
        for i in start..=end {
            let chapter_str = format!("{:03}", i);
            let original_url = format!("{}{}", base_pattern, chapter_str);
            
            let final_url = if let Some(ref prefix) = redirect_prefix {
                let encoded = general_purpose::STANDARD.encode(original_url);
                format!("{}{}", prefix, encoded)
            } else {
                original_url
            };
            
            result.push(ScrapedChapter {
                season,
                number: i,
                title: format!("Capítulo {}", chapter_str),
                url: final_url,
            });
        }
    }

    Some(result)
}

pub fn unpack_dean_edwards(packed: &str) -> Option<String> {
    let re = regex::Regex::new(r#"(?s)eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*[dr]\s*\).*?\}\s*\(\s*('(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\`|[^`])*`)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*('(?:\\.|[^'])*'|"(?:\\.|[^"])*"|`(?:\`|[^`])*`)\.split\s*\(\s*['"`].*?['"`]\s*\)"#).ok()?;
    let caps = re.captures(packed)?;
    
    let packed_code = caps.get(1)?.as_str();
    let a_val: u32 = caps.get(2)?.as_str().parse().ok()?;
    let _c_val: u32 = caps.get(3)?.as_str().parse().ok()?;
    let keywords_str = caps.get(4)?.as_str();
    
    let cleaned_keywords = if keywords_str.starts_with('\'') || keywords_str.starts_with('"') || keywords_str.starts_with('`') {
        &keywords_str[1..keywords_str.len()-1]
    } else {
        keywords_str
    };
    let keywords: Vec<&str> = cleaned_keywords.split('|').collect();

    let cleaned_code = if packed_code.starts_with('\'') || packed_code.starts_with('"') || packed_code.starts_with('`') {
        &packed_code[1..packed_code.len()-1]
    } else {
        packed_code
    };

    let base62_to_usize = |s: &str| -> usize {
        let mut val = 0;
        for c in s.chars() {
            let digit = match c {
                '0'..='9' => (c as usize) - ('0' as usize),
                'a'..='z' => (c as usize) - ('a' as usize) + 10,
                'A'..='Z' => (c as usize) - ('A' as usize) + 36,
                _ => return 0,
            };
            val = val * (a_val as usize) + digit;
        }
        val
    };

    let re_word = regex::Regex::new(r"\b[0-9a-zA-Z]+\b").unwrap();
    let unpacked = re_word.replace_all(cleaned_code, |word_caps: &regex::Captures| {
        let token = &word_caps[0];
        let val = base62_to_usize(token);
        if val < keywords.len() && !keywords[val].is_empty() {
            keywords[val].to_string()
        } else {
            token.to_string()
        }
    }).to_string();

    Some(unpacked)
}

pub fn parse_anime_title(title: &str) -> (String, i32, Option<i32>) {
    let mut title_cleaned = title.trim().to_string();
    
    // Check and strip "Part X" or "Parte X"
    let mut part_num = None;
    let re_part = regex::Regex::new(r"(?i)\s+Part(?:e)?\s+(\d+)").unwrap();
    if let Some(caps) = re_part.captures(&title_cleaned) {
        if let Ok(num) = caps[1].parse::<i32>() {
            part_num = Some(num);
        }
        title_cleaned = re_part.replace_all(&title_cleaned, "").into_owned();
    }

    let mut season_num = 1;

    // 1. Season X (e.g. "Season 2")
    let re_season_prefix = regex::Regex::new(r"(?i)\s+Season\s+(\d+)").unwrap();
    if let Some(caps) = re_season_prefix.captures(&title_cleaned) {
        if let Ok(num) = caps[1].parse::<i32>() {
            season_num = num;
        }
        title_cleaned = re_season_prefix.replace_all(&title_cleaned, "").into_owned();
    }
    // 2. Xnd Season (e.g. "2nd Season", "2 Season")
    else {
        let re_season_suffix = regex::Regex::new(r"(?i)\s+(\d+)(?:st|nd|rd|th)?\s+Season").unwrap();
        if let Some(caps) = re_season_suffix.captures(&title_cleaned) {
            if let Ok(num) = caps[1].parse::<i32>() {
                season_num = num;
            }
            title_cleaned = re_season_suffix.replace_all(&title_cleaned, "").into_owned();
        }
        // 3. Roman numerals (anywhere in the title, e.g. "Mushoku Tensei II: ...")
        else {
            let re_roman = regex::Regex::new(r"(?i)\s+(II|III|IV|V|VI|VII|VIII|IX|X)\b(\s*:?)").unwrap();
            if let Some(caps) = re_roman.captures(&title_cleaned) {
                let roman = caps[1].to_uppercase();
                season_num = match roman.as_str() {
                    "II" => 2,
                    "III" => 3,
                    "IV" => 4,
                    "V" => 5,
                    "VI" => 6,
                    "VII" => 7,
                    "VIII" => 8,
                    "IX" => 9,
                    "X" => 10,
                    _ => 1,
                };
                let suffix = &caps[2];
                title_cleaned = re_roman.replace(&title_cleaned, suffix).into_owned();
            }
        }
    }

    (title_cleaned.trim().to_string(), season_num, part_num)
}


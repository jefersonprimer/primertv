use worker::scraper::ChannelScraper;

#[tokio::main]
async fn main() {
    let scraper = ChannelScraper::new();

    let target = "GLOBO NEWS";
    println!("Testing ChannelScraper::scrape for '{}'...", target);

    match scraper.scrape(target).await {
        Ok(Some(scraped)) => {
            println!("SUCCESS: Scraped channel!");
            println!("Title: {}", scraped.title);
            println!("Image URL: {:?}", scraped.image_url);
            println!("Video URL: {}", scraped.video_url);
        }
        Ok(None) => {
            println!("FAILED: Scraper returned None (no channel found)");
        }
        Err(e) => {
            println!("ERROR: {:?}", e);
        }
    }
}

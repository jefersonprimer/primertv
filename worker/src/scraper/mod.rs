pub mod anime;
pub mod channels;
pub mod engine;
pub mod manga;
pub mod models;
pub mod movies;
pub mod novelas;
pub mod series;
pub mod utils;

pub use anime::AnimeScraper;
pub use channels::ChannelScraper;
pub use manga::MangaScraper;
pub use movies::MovieScraper;
pub use novelas::NovelaScraper;
pub use series::SeriesScraper;

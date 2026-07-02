-- CreateIndex
CREATE INDEX IF NOT EXISTS "Anime_lower_title_idx" ON "Anime" (LOWER("title") text_pattern_ops);
CREATE INDEX IF NOT EXISTS "Anime_lower_titleEnglish_idx" ON "Anime" (LOWER("titleEnglish") text_pattern_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Series_lower_title_idx" ON "Series" (LOWER("title") text_pattern_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Movie_lower_title_idx" ON "Movie" (LOWER("title") text_pattern_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Manga_lower_title_idx" ON "Manga" (LOWER("title") text_pattern_ops);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novela_lower_title_idx" ON "Novela" (LOWER("title") text_pattern_ops);

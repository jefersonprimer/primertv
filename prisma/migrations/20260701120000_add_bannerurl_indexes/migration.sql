-- CreateIndex
CREATE INDEX IF NOT EXISTS "Anime_bannerUrl_createdAt_idx" ON "Anime" ("bannerUrl", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Series_bannerUrl_createdAt_idx" ON "Series" ("bannerUrl", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Movie_bannerUrl_createdAt_idx" ON "Movie" ("bannerUrl", "createdAt");

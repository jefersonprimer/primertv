-- CreateIndex
CREATE INDEX IF NOT EXISTS "Anime_status_createdAt_idx" ON "Anime" ("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Anime_updatedAt_idx" ON "Anime" ("updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Series_score_createdAt_idx" ON "Series" ("score", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Series_updatedAt_idx" ON "Series" ("updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Movie_score_createdAt_idx" ON "Movie" ("score", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Movie_updatedAt_idx" ON "Movie" ("updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Manga_updatedAt_idx" ON "Manga" ("updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Novela_updatedAt_idx" ON "Novela" ("updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WatchlistItem_userId_mediaType_createdAt_idx" ON "WatchlistItem" ("userId", "mediaType", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomListItem_listId_createdAt_idx" ON "CustomListItem" ("listId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_anime_genres" ON "Anime" USING GIN ("genres");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_series_genres" ON "Series" USING GIN ("genres");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_movie_genres" ON "Movie" USING GIN ("genres");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_manga_genres" ON "Manga" USING GIN ("genres");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_novela_genres" ON "Novela" USING GIN ("genres");

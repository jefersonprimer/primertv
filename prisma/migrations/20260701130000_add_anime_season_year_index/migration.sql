-- CreateIndex
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "season" TEXT;
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "year" INTEGER;
CREATE INDEX IF NOT EXISTS "Anime_season_year_idx" ON "Anime" ("season", "year");

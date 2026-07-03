ALTER TABLE "Anime"
ADD COLUMN "anilistId" INTEGER,
ADD COLUMN "malId" INTEGER;

CREATE UNIQUE INDEX "Anime_anilistId_key" ON "Anime"("anilistId");
CREATE UNIQUE INDEX "Anime_malId_key" ON "Anime"("malId");

CREATE TABLE IF NOT EXISTS "AnikotoSeries" (
    "id" TEXT NOT NULL,
    "anikotoId" INTEGER NOT NULL,
    "aniId" INTEGER,
    "malId" INTEGER,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "year" INTEGER,
    "subEpisodes" INTEGER,
    "dubEpisodes" INTEGER,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnikotoSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnikotoSeries_anikotoId_key" ON "AnikotoSeries"("anikotoId");
CREATE INDEX IF NOT EXISTS "AnikotoSeries_aniId_idx" ON "AnikotoSeries"("aniId");
CREATE INDEX IF NOT EXISTS "AnikotoSeries_malId_idx" ON "AnikotoSeries"("malId");
CREATE INDEX IF NOT EXISTS "AnikotoSeries_syncedAt_idx" ON "AnikotoSeries"("syncedAt");

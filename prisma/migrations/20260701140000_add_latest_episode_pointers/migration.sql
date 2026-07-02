-- AlterTable
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "latestSeasonId" TEXT;
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "latestEpisodeId" TEXT;
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "latestEpisodeNumber" INTEGER;
ALTER TABLE "Anime" ADD COLUMN IF NOT EXISTS "latestEpisodeAt" TIMESTAMP(3);

ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "latestSeasonId" TEXT;
ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "latestEpisodeId" TEXT;
ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "latestEpisodeNumber" INTEGER;
ALTER TABLE "Series" ADD COLUMN IF NOT EXISTS "latestEpisodeAt" TIMESTAMP(3);

ALTER TABLE "Novela" ADD COLUMN IF NOT EXISTS "latestSeasonId" TEXT;
ALTER TABLE "Novela" ADD COLUMN IF NOT EXISTS "latestEpisodeId" TEXT;
ALTER TABLE "Novela" ADD COLUMN IF NOT EXISTS "latestEpisodeNumber" INTEGER;
ALTER TABLE "Novela" ADD COLUMN IF NOT EXISTS "latestEpisodeAt" TIMESTAMP(3);

ALTER TABLE "Manga" ADD COLUMN IF NOT EXISTS "latestChapterId" TEXT;
ALTER TABLE "Manga" ADD COLUMN IF NOT EXISTS "latestChapterNumber" DOUBLE PRECISION;
ALTER TABLE "Manga" ADD COLUMN IF NOT EXISTS "latestChapterAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Anime_latestEpisodeAt_idx" ON "Anime" ("latestEpisodeAt");
CREATE INDEX IF NOT EXISTS "Series_latestEpisodeAt_idx" ON "Series" ("latestEpisodeAt");
CREATE INDEX IF NOT EXISTS "Novela_latestEpisodeAt_idx" ON "Novela" ("latestEpisodeAt");
CREATE INDEX IF NOT EXISTS "Manga_latestChapterAt_idx" ON "Manga" ("latestChapterAt");

-- Backfill latest episode/chapter pointers for existing rows
UPDATE "Anime" a
SET
  "latestSeasonId" = latest."seasonId",
  "latestEpisodeId" = latest."episodeId",
  "latestEpisodeNumber" = latest."episodeNumber",
  "latestEpisodeAt" = latest."episodeAt"
FROM (
  SELECT DISTINCT ON (s."animeId")
    s."animeId",
    s.id AS "seasonId",
    e.id AS "episodeId",
    e.number AS "episodeNumber",
    e."createdAt" AS "episodeAt"
  FROM "Season" s
  LEFT JOIN LATERAL (
    SELECT id, number, "createdAt"
    FROM "Episode"
    WHERE "seasonId" = s.id
    ORDER BY "createdAt" DESC, number DESC
    LIMIT 1
  ) e ON TRUE
  ORDER BY s."animeId", s.number DESC
) latest
WHERE a.id = latest."animeId";

UPDATE "Series" s
SET
  "latestSeasonId" = latest."seasonId",
  "latestEpisodeId" = latest."episodeId",
  "latestEpisodeNumber" = latest."episodeNumber",
  "latestEpisodeAt" = latest."episodeAt"
FROM (
  SELECT DISTINCT ON (ss."seriesId")
    ss."seriesId",
    ss.id AS "seasonId",
    se.id AS "episodeId",
    se.number AS "episodeNumber",
    se."createdAt" AS "episodeAt"
  FROM "SeriesSeason" ss
  LEFT JOIN LATERAL (
    SELECT id, number, "createdAt"
    FROM "SeriesEpisode"
    WHERE "seasonId" = ss.id
    ORDER BY "createdAt" DESC, number DESC
    LIMIT 1
  ) se ON TRUE
  ORDER BY ss."seriesId", ss.number DESC
) latest
WHERE s.id = latest."seriesId";

UPDATE "Novela" n
SET
  "latestSeasonId" = latest."seasonId",
  "latestEpisodeId" = latest."episodeId",
  "latestEpisodeNumber" = latest."episodeNumber",
  "latestEpisodeAt" = latest."episodeAt"
FROM (
  SELECT DISTINCT ON (ns."novelaId")
    ns."novelaId",
    ns.id AS "seasonId",
    ne.id AS "episodeId",
    ne.number AS "episodeNumber",
    ne."createdAt" AS "episodeAt"
  FROM "NovelaSeason" ns
  LEFT JOIN LATERAL (
    SELECT id, number, "createdAt"
    FROM "NovelaEpisode"
    WHERE "seasonId" = ns.id
    ORDER BY "createdAt" DESC, number DESC
    LIMIT 1
  ) ne ON TRUE
  ORDER BY ns."novelaId", ns.number DESC
) latest
WHERE n.id = latest."novelaId";

UPDATE "Manga" m
SET
  "latestChapterId" = latest."chapterId",
  "latestChapterNumber" = latest."chapterNumber",
  "latestChapterAt" = latest."chapterAt"
FROM (
  SELECT DISTINCT ON (c."mangaId")
    c."mangaId",
    c.id AS "chapterId",
    c.number AS "chapterNumber",
    c."createdAt" AS "chapterAt"
  FROM "Chapter" c
  ORDER BY c."mangaId", c."createdAt" DESC, c.number DESC
) latest
WHERE m.id = latest."mangaId";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReleaseType =
  | "animes"
  | "series"
  | "novelas"
  | "filmes"
  | "mangas";

export type ReleaseRow = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  addedAt: Date;
};

export type FirstEpisodeRow = {
  mediaId: string;
  firstEpisodeId: string;
  firstEpisodeImageUrl: string | null;
};

function toLookupMap(rows: FirstEpisodeRow[]) {
  return new Map(rows.map((row) => [row.mediaId, row]));
}

export async function getFirstAnimeEpisodes(
  animeIds: string[],
): Promise<Map<string, FirstEpisodeRow>> {
  if (animeIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<FirstEpisodeRow[]>`
    SELECT DISTINCT ON (s."animeId")
      s."animeId" AS "mediaId",
      ep.id AS "firstEpisodeId",
      ep."imageUrl" AS "firstEpisodeImageUrl"
    FROM "Season" s
    JOIN "Episode" ep ON ep."seasonId" = s.id
    WHERE s."animeId" IN (${Prisma.join(animeIds)})
    ORDER BY s."animeId", s."number" ASC, ep."number" ASC
  `;

  return toLookupMap(rows);
}

export async function getFirstSeriesEpisodes(
  seriesIds: string[],
): Promise<Map<string, FirstEpisodeRow>> {
  if (seriesIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<FirstEpisodeRow[]>`
    SELECT DISTINCT ON (s."seriesId")
      s."seriesId" AS "mediaId",
      ep.id AS "firstEpisodeId",
      NULL::text AS "firstEpisodeImageUrl"
    FROM "SeriesSeason" s
    JOIN "SeriesEpisode" ep ON ep."seasonId" = s.id
    WHERE s."seriesId" IN (${Prisma.join(seriesIds)})
    ORDER BY s."seriesId", s."number" ASC, ep."number" ASC
  `;

  return toLookupMap(rows);
}

export async function getFirstNovelaEpisodes(
  novelaIds: string[],
): Promise<Map<string, FirstEpisodeRow>> {
  if (novelaIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<FirstEpisodeRow[]>`
    SELECT DISTINCT ON (s."novelaId")
      s."novelaId" AS "mediaId",
      ep.id AS "firstEpisodeId",
      NULL::text AS "firstEpisodeImageUrl"
    FROM "NovelaSeason" s
    JOIN "NovelaEpisode" ep ON ep."seasonId" = s.id
    WHERE s."novelaId" IN (${Prisma.join(novelaIds)})
    ORDER BY s."novelaId", s."number" ASC, ep."number" ASC
  `;

  return toLookupMap(rows);
}

export async function getFirstMangaChapter(mangaId: string): Promise<{
  id: string;
  number: number;
  publicId: string | null;
  slug: string | null;
} | null> {
  const chapter = await prisma.chapter.findFirst({
    where: { mangaId },
    orderBy: [{ number: "asc" }, { createdAt: "asc" }],
    select: { id: true, number: true, publicId: true, slug: true },
  });

  return chapter ?? null;
}

export async function getLatestReleaseRows(
  type: ReleaseType,
  limit: number,
): Promise<ReleaseRow[]> {
  if (type === "animes") {
    return prisma.$queryRaw<ReleaseRow[]>`
      SELECT
        a.id,
        a.slug,
        a.title,
        a."imageUrl",
        GREATEST(
          a."updatedAt",
          COALESCE(MAX(e."createdAt"), a."updatedAt")
        ) AS "addedAt"
      FROM "Anime" a
      LEFT JOIN "Season" s ON s."animeId" = a.id
      LEFT JOIN "Episode" e ON e."seasonId" = s.id
      GROUP BY a.id, a.slug, a.title, a."imageUrl", a."updatedAt"
      ORDER BY "addedAt" DESC, a."updatedAt" DESC
      LIMIT ${limit}
    `;
  }

  if (type === "series") {
    return prisma.$queryRaw<ReleaseRow[]>`
      SELECT
        s.id,
        s.slug,
        s.title,
        s."imageUrl",
        GREATEST(
          s."updatedAt",
          COALESCE(MAX(se."createdAt"), s."updatedAt")
        ) AS "addedAt"
      FROM "Series" s
      LEFT JOIN "SeriesSeason" ss ON ss."seriesId" = s.id
      LEFT JOIN "SeriesEpisode" se ON se."seasonId" = ss.id
      GROUP BY s.id, s.slug, s.title, s."imageUrl", s."updatedAt"
      ORDER BY "addedAt" DESC, s."updatedAt" DESC
      LIMIT ${limit}
    `;
  }

  if (type === "novelas") {
    return prisma.$queryRaw<ReleaseRow[]>`
      SELECT
        n.id,
        n.slug,
        n.title,
        n."imageUrl",
        GREATEST(
          n."updatedAt",
          COALESCE(MAX(ne."createdAt"), n."updatedAt")
        ) AS "addedAt"
      FROM "Novela" n
      LEFT JOIN "NovelaSeason" ns ON ns."novelaId" = n.id
      LEFT JOIN "NovelaEpisode" ne ON ne."seasonId" = ns.id
      GROUP BY n.id, n.slug, n.title, n."imageUrl", n."updatedAt"
      ORDER BY "addedAt" DESC, n."updatedAt" DESC
      LIMIT ${limit}
    `;
  }

  if (type === "mangas") {
    return prisma.$queryRaw<ReleaseRow[]>`
      SELECT
        m.id,
        m.slug,
        m.title,
        m."imageUrl",
        GREATEST(
          m."updatedAt",
          COALESCE(MAX(c."createdAt"), m."updatedAt")
        ) AS "addedAt"
      FROM "Manga" m
      LEFT JOIN "Chapter" c ON c."mangaId" = m.id
      GROUP BY m.id, m.slug, m.title, m."imageUrl", m."updatedAt"
      ORDER BY "addedAt" DESC, m."updatedAt" DESC
      LIMIT ${limit}
    `;
  }

  return prisma.$queryRaw<ReleaseRow[]>`
    SELECT
      m.id,
      m.slug,
      m.title,
      m."imageUrl",
      m."createdAt" AS "addedAt"
    FROM "Movie" m
    ORDER BY m."createdAt" DESC
    LIMIT ${limit}
  `;
}

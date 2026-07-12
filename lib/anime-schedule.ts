import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AnimeScheduleRow = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  rating: string | null;
  aired: string | null;
  status: string | null;
  broadcastDay: string | null;
  broadcastTime: string | null;
  latestSeasonId: string | null;
  latestEpisodeId: string | null;
  latestEpisodeNumber: number | null;
  latestEpisodeAt: Date | null;
  episodeId: string | null;
  episodeNumber: number | null;
  episodeImageUrl: string | null;
  episodeCreatedAt: Date | null;
  episodePublicId: string | null;
  episodeSlug: string | null;
  seasonNumber: number | null;
  season: string | null;
  year: number | null;
};

type AnimeScheduleOptions = {
  limit: number;
  whereSql?: Prisma.Sql;
};

export async function getAnimeScheduleRows({
  limit,
  whereSql,
}: AnimeScheduleOptions): Promise<AnimeScheduleRow[]> {
  const filter = whereSql ?? Prisma.sql`TRUE`;

  return prisma.$queryRaw<AnimeScheduleRow[]>`
    WITH base AS (
      SELECT
        a.id,
        a.slug,
        a.title,
        a."imageUrl",
        a."bannerUrl",
        a.description,
        a.rating,
        a.aired,
        a.status,
        a."broadcastDay",
        a."broadcastTime",
        a."latestSeasonId",
        a."latestEpisodeId",
        a."latestEpisodeNumber",
        a."latestEpisodeAt",
        a.season,
        a.year
      FROM "Anime" a
      WHERE ${filter}
      ORDER BY a."createdAt" DESC
      LIMIT ${limit}
    )
    SELECT
      b.id,
      b.slug,
      b.title,
      b."imageUrl",
      b."bannerUrl",
      b.description,
      b.rating,
      b.aired,
      b.status,
      b."broadcastDay",
      b."broadcastTime",
      b."latestSeasonId",
      b."latestEpisodeId",
      b."latestEpisodeNumber",
      b."latestEpisodeAt",
      b.season,
      b.year,
      s.number AS "seasonNumber",
      e.id AS "episodeId",
      e.number AS "episodeNumber",
      e."imageUrl" AS "episodeImageUrl",
      e."createdAt" AS "episodeCreatedAt",
      e."publicId" AS "episodePublicId",
      e."slug" AS "episodeSlug"
    FROM base b
    LEFT JOIN "Season" s ON s.id = b."latestSeasonId"
    LEFT JOIN "Episode" e ON e."seasonId" = s.id
    ORDER BY b.id, e.number ASC NULLS LAST
  `;
}

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";

export const MAX_HISTORY_ITEMS = 24;

type AnimeWatchHistoryRow = {
  id: string;
  watchedAt: Date;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string | null;
  episodeImageUrl: string | null;
  episodePublicId: string | null;
  episodeSlug: string | null;
  seasonNumber: number;
  animeId: string;
  animeSlug: string;
  animeTitle: string;
  animeImageUrl: string | null;
};


export async function recordAnimeWatchHistory(episodeId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return;

  await prisma.$transaction(async (tx) => {
    await tx.watchHistory.upsert({
      where: {
        userId_episodeId: { userId, episodeId },
      },
      create: { userId, episodeId },
      update: { watchedAt: new Date() },
    });

    const overflow = await tx.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      skip: MAX_HISTORY_ITEMS,
      select: { id: true },
    });

    if (overflow.length > 0) {
      await tx.watchHistory.deleteMany({
        where: { id: { in: overflow.map((item) => item.id) } },
      });
    }
  });
}

export async function getAnimeWatchHistory(userId: string) {
  const rows = await prisma.$queryRaw<AnimeWatchHistoryRow[]>`
    SELECT
      wh.id,
      wh."watchedAt",
      e.id AS "episodeId",
      e.number AS "episodeNumber",
      e.title AS "episodeTitle",
      e."imageUrl" AS "episodeImageUrl",
      e."publicId" AS "episodePublicId",
      e.slug AS "episodeSlug",
      s.number AS "seasonNumber",
      a.id AS "animeId",
      a.slug AS "animeSlug",
      a.title AS "animeTitle",
      a."imageUrl" AS "animeImageUrl"
    FROM "WatchHistory" wh
    JOIN "Episode" e ON e.id = wh."episodeId"
    JOIN "Season" s ON s.id = e."seasonId"
    JOIN "Anime" a ON a.id = s."animeId"
    WHERE wh."userId" = ${userId}
    ORDER BY wh."watchedAt" DESC
    LIMIT ${MAX_HISTORY_ITEMS}
  `;

  return rows.map((row) => ({
    id: row.id,
    watchedAt: row.watchedAt,
    episode: {
      id: row.episodeId,
      number: row.episodeNumber,
      title: row.episodeTitle,
      imageUrl: row.episodeImageUrl,
      publicId: row.episodePublicId,
      slug: row.episodeSlug,
      season: {
        number: row.seasonNumber,
        anime: {
          id: row.animeId,
          slug: row.animeSlug,
          title: row.animeTitle,
          imageUrl: row.animeImageUrl,
        },
      },
    },
  }));
}

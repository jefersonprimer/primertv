import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";

export const MAX_HISTORY_ITEMS = 24;

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
  return prisma.watchHistory.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    take: MAX_HISTORY_ITEMS,
    include: {
      episode: {
        select: {
          id: true,
          number: true,
          title: true,
          season: {
            select: {
              number: true,
              anime: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

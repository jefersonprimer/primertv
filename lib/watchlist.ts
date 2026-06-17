import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { WatchlistMediaType } from "@prisma/client";

export async function getAuthenticatedUserId() {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId || userId === "admin") {
    return null;
  }

  return userId;
}

export async function isInWatchlist(
  mediaType: WatchlistMediaType,
  mediaId: string,
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;

  const item = await prisma.watchlistItem.findFirst({
    where: {
      userId,
      mediaType,
      ...(mediaType === "ANIME" ? { animeId: mediaId } : { mangaId: mediaId }),
    },
    select: { id: true },
  });

  return Boolean(item);
}

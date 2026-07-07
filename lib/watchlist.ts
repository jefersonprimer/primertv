import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { WatchlistMediaType } from "@prisma/client";
import { cache } from "react";

export const getAuthenticatedUserId = cache(async () => {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId || userId === "admin") {
    return null;
  }

  // Verify the user actually exists in the database to prevent foreign key errors (e.g. if db was reset or user deleted)
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!userExists) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      cookieStore.delete("session");
    } catch {
      // Ignore if cookies cannot be deleted (e.g. in render context)
    }
    return null;
  }

  return userId;
});

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
      ...(mediaType === "ANIME"
        ? { animeId: mediaId }
        : mediaType === "MANGA"
        ? { mangaId: mediaId }
        : { seriesId: mediaId }),
    },
    select: { id: true },
  });

  return Boolean(item);
}

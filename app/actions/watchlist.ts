"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import type { WatchlistMediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";

type WatchlistActionState = {
  error?: string;
  inWatchlist?: boolean;
};

export async function toggleWatchlist(
  _prevState: WatchlistActionState | undefined,
  formData: FormData,
): Promise<WatchlistActionState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "Faça login para usar a watchlist." };
  }

  const mediaType = formData.get("mediaType") as WatchlistMediaType;
  const mediaId = formData.get("mediaId") as string;
  const slug = formData.get("slug") as string;

  if (!mediaType || !mediaId || !slug) {
    return { error: "Dados inválidos." };
  }

  if (mediaType !== "ANIME" && mediaType !== "MANGA" && mediaType !== "SERIES") {
    return { error: "Tipo de mídia inválido." };
  }

  const existing = await prisma.watchlistItem.findFirst({
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

  const getRevalidatePath = (type: WatchlistMediaType, s: string) => {
    if (type === "ANIME") return `/animes/${s}`;
    if (type === "MANGA") return `/mangas/${s}`;
    return `/series/${s}`;
  };

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    revalidatePath(getRevalidatePath(mediaType, slug));
    revalidatePath("/watchlist");
    return { inWatchlist: false };
  }

  await prisma.watchlistItem.create({
    data: {
      userId,
      mediaType,
      ...(mediaType === "ANIME"
        ? { animeId: mediaId }
        : mediaType === "MANGA"
        ? { mangaId: mediaId }
        : { seriesId: mediaId }),
    },
  });

  revalidatePath(getRevalidatePath(mediaType, slug));
  revalidatePath("/watchlist");
  return { inWatchlist: true };
}

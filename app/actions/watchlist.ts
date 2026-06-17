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

  if (mediaType !== "ANIME" && mediaType !== "MANGA") {
    return { error: "Tipo de mídia inválido." };
  }

  const existing = await prisma.watchlistItem.findFirst({
    where: {
      userId,
      mediaType,
      ...(mediaType === "ANIME" ? { animeId: mediaId } : { mangaId: mediaId }),
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } });
    revalidatePath(mediaType === "ANIME" ? `/animes/${slug}` : `/mangas/${slug}`);
    revalidatePath("/watchlist");
    return { inWatchlist: false };
  }

  await prisma.watchlistItem.create({
    data: {
      userId,
      mediaType,
      ...(mediaType === "ANIME" ? { animeId: mediaId } : { mangaId: mediaId }),
    },
  });

  revalidatePath(mediaType === "ANIME" ? `/animes/${slug}` : `/mangas/${slug}`);
  revalidatePath("/watchlist");
  return { inWatchlist: true };
}

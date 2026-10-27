"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory, HISTORY_PAGE_SIZE, MAX_HISTORY_ITEMS } from "@/lib/history";

export async function loadHistoryPage(offset: number) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { items: [], hasMore: false };
  const safeOffset = Number.isFinite(offset)
    ? Math.min(MAX_HISTORY_ITEMS, Math.max(0, Math.floor(offset)))
    : 0;
  const rows = await getAnimeWatchHistory(userId, HISTORY_PAGE_SIZE + 1, safeOffset);
  const hasMore = rows.length > HISTORY_PAGE_SIZE;
  const items = rows.slice(0, HISTORY_PAGE_SIZE).map((item) => {
    const episode = item.episode;
    const season = episode.season;
    const anime = season.anime;
    return {
      id: item.id,
      episodeId: episode.id,
      episodeNumber: episode.number,
      episodeTitle: episode.title,
      episodeImageUrl: episode.imageUrl,
      episodePublicId: episode.publicId,
      episodeSlug: episode.slug,
      seasonNumber: season.number,
      animeId: anime.id,
      animeSlug: anime.slug,
      animeTitle: anime.title,
      animeImageUrl: anime.imageUrl,
      watchedAt: item.watchedAt,
      isDubbed: anime.isDubbed,
      isSubtitled: anime.isSubtitled,
    };
  });
  return { items, hasMore };
}

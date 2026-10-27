import { prisma } from "@/lib/prisma";
import { getAnimeBanner } from "@/lib/banners";
import { getFirstAnimeEpisodes } from "@/lib/media-performance";

export const WATCHLIST_PAGE_SIZE = 20;
export type WatchlistSort = "newest" | "oldest";
export type WatchlistAudio = "all" | "subtitle" | "dubbed";

export type WatchlistPageItem =
  | { kind: "anime"; id: string; createdAt: string; item: {
      id: string; slug: string; title: string; bannerUrl: string | null;
      animeImageUrl: string | null; firstEpisodeId: string | null;
      firstEpisodeHref: string | null; firstEpisodeImageUrl: string | null;
      rating: string | null; duration: string | null; isDubbed: boolean; isSubtitled: boolean;
    } }
  | { kind: "series"; id: string; createdAt: string; item: {
      id: string; slug: string; title: string; imageUrl: string | null;
    } }
  | { kind: "manga"; id: string; createdAt: string; item: {
      id: string; slug: string; title: string; imageUrl: string | null;
    } };

export async function getWatchlistPageData(
  userId: string,
  offset: number,
  sort: WatchlistSort,
  audio: WatchlistAudio,
) {
  const audioWhere = audio === "all" ? {} : {
    OR: [
      { mediaType: { not: "ANIME" as const } },
      { mediaType: "ANIME" as const, anime: audio === "dubbed" ? { isDubbed: true } : { isSubtitled: true } },
    ],
  };
  const rows = await prisma.watchlistItem.findMany({
    where: { userId, ...audioWhere },
    orderBy: [{ createdAt: sort === "newest" ? "desc" : "asc" }, { id: "asc" }],
    skip: offset,
    take: WATCHLIST_PAGE_SIZE + 1,
    select: { id: true, mediaType: true, animeId: true, mangaId: true, seriesId: true, createdAt: true },
  });
  const hasMore = rows.length > WATCHLIST_PAGE_SIZE;
  const pageRows = rows.slice(0, WATCHLIST_PAGE_SIZE);
  const animeIds = pageRows.flatMap((row) => row.mediaType === "ANIME" && row.animeId ? [row.animeId] : []);
  const mangaIds = pageRows.flatMap((row) => row.mediaType === "MANGA" && row.mangaId ? [row.mangaId] : []);
  const seriesIds = pageRows.flatMap((row) => row.mediaType === "SERIES" && row.seriesId ? [row.seriesId] : []);
  const [animes, mangas, series, episodes] = await Promise.all([
    prisma.anime.findMany({ where: { id: { in: animeIds } }, select: { id: true, slug: true, title: true, imageUrl: true, bannerUrl: true, rating: true, duration: true, isDubbed: true, isSubtitled: true, anilistId: true, malId: true } }),
    prisma.manga.findMany({ where: { id: { in: mangaIds } }, select: { id: true, slug: true, title: true, imageUrl: true } }),
    prisma.series.findMany({ where: { id: { in: seriesIds } }, select: { id: true, slug: true, title: true, imageUrl: true } }),
    getFirstAnimeEpisodes(animeIds),
  ]);
  const animeById = new Map(animes.map((item) => [item.id, item]));
  const mangaById = new Map(mangas.map((item) => [item.id, item]));
  const seriesById = new Map(series.map((item) => [item.id, item]));
  const mapped = await Promise.all(pageRows.map(async (row): Promise<WatchlistPageItem | null> => {
    if (row.mediaType === "ANIME" && row.animeId) {
      const anime = animeById.get(row.animeId);
      if (!anime) return null;
      const episode = episodes.get(anime.id);
      let banner = anime.bannerUrl || await getAnimeBanner(anime.id, anime.title);
      if (banner === "none") banner = null;
      const firstEpisodeId = episode?.firstEpisodeId || null;
      return { kind: "anime", id: row.id, createdAt: row.createdAt.toISOString(), item: {
        id: anime.id, slug: anime.slug, title: anime.title, bannerUrl: banner || anime.imageUrl,
        animeImageUrl: anime.imageUrl, firstEpisodeId,
        firstEpisodeHref: firstEpisodeId ? `/watch/${firstEpisodeId}` : anime.anilistId || anime.malId ? `/watch/${anime.slug}/episode-1?source=megaplay&episode=1&season=1` : null,
        firstEpisodeImageUrl: episode?.firstEpisodeImageUrl || null, rating: anime.rating, duration: anime.duration,
        isDubbed: anime.isDubbed, isSubtitled: anime.isSubtitled,
      } };
    }
    if (row.mediaType === "MANGA" && row.mangaId) {
      const item = mangaById.get(row.mangaId);
      return item ? { kind: "manga", id: row.id, createdAt: row.createdAt.toISOString(), item } : null;
    }
    if (row.mediaType === "SERIES" && row.seriesId) {
      const item = seriesById.get(row.seriesId);
      return item ? { kind: "series", id: row.id, createdAt: row.createdAt.toISOString(), item } : null;
    }
    return null;
  }));
  return { items: mapped.filter((item): item is WatchlistPageItem => item !== null), hasMore };
}

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { getAnimeBanner } from "@/lib/banners";
import { FavoritesCarouselClient } from "./FavoritesCarouselClient";
import { getFirstAnimeEpisodes } from "@/lib/media-performance";

type FavoriteAnime = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  rating: string | null;
  duration: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
};

export async function FavoritesCarousel() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const watchlistItems = await prisma.watchlistItem.findMany({
    where: {
      userId,
      mediaType: "ANIME",
      animeId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      animeId: true,
    },
  });

  const animeIds = watchlistItems
    .map((item) => item.animeId)
    .filter((animeId): animeId is string => Boolean(animeId));

  if (animeIds.length === 0) return null;

  const favoritesById = new Map(
    (
      await prisma.anime.findMany({
        where: {
          id: { in: animeIds },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
          bannerUrl: true,
          rating: true,
          duration: true,
          isDubbed: true,
          isSubtitled: true,
        },
      })
    ).map((anime) => [anime.id, anime]),
  );

  const favorites: FavoriteAnime[] = animeIds
    .map((animeId) => favoritesById.get(animeId))
    .filter((anime): anime is NonNullable<typeof anime> => Boolean(anime));

  if (favorites.length === 0) return null;

  const firstEpisodeByAnimeId = await getFirstAnimeEpisodes(
    favorites.map((anime) => anime.id),
  );

  const firstEpisodeIds = Array.from(firstEpisodeByAnimeId.values())
    .map((row) => row.firstEpisodeId)
    .filter(Boolean) as string[];

  const episodeDetails =
    firstEpisodeIds.length > 0
      ? await prisma.episode.findMany({
          where: { id: { in: firstEpisodeIds } },
          select: { id: true, publicId: true, slug: true, number: true },
        })
      : [];

  const episodeDetailsMap = new Map(episodeDetails.map((ep) => [ep.id, ep]));

  const resolvedItems = await Promise.all(
    favorites.map(async (anime) => {
      let banner = anime.bannerUrl;
      if (!banner) {
        banner = await getAnimeBanner(anime.id, anime.title);
      }
      const finalBannerUrl = banner === "none" ? null : banner;

      const firstEpisode = firstEpisodeByAnimeId.get(anime.id);
      const firstEpisodeId = firstEpisode?.firstEpisodeId || null;
      const firstEpisodeImageUrl = firstEpisode?.firstEpisodeImageUrl || null;

      const epDetails = firstEpisodeId
        ? episodeDetailsMap.get(firstEpisodeId)
        : null;
      const firstEpisodePublicId = epDetails?.publicId ?? null;
      const firstEpisodeSlug = epDetails
        ? epDetails.slug || `episode-${epDetails.number}`
        : null;

      return {
        id: anime.id,
        slug: anime.slug,
        title: anime.title,
        bannerUrl: finalBannerUrl || anime.imageUrl,
        animeImageUrl: anime.imageUrl,
        firstEpisodeId,
        firstEpisodeImageUrl,
        firstEpisodePublicId,
        firstEpisodeSlug,
        rating: anime.rating,
        duration: anime.duration,
        isDubbed: anime.isDubbed,
        isSubtitled: anime.isSubtitled,
      };
    }),
  );

  return <FavoritesCarouselClient items={resolvedItems} />;
}

export function FavoritesCarouselSkeleton() {
  return (
    <section className="relative">
      <div
        className="mb-6 w-full"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <div className="h-8 w-48 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-64 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Desktop/Tablet Skeleton */}
      <div
        className="hidden sm:flex gap-6 overflow-hidden pb-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-[260px] flex-shrink-0 sm:w-[300px] lg:w-[287.75px]"
          >
            <div className="flex flex-col gap-2">
              <div className="relative aspect-video w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-3/4 animate-pulse bg-zinc-200 dark:bg-zinc-800 mt-1" />
              <div className="h-3 w-1/2 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Skeleton */}
      <div
        className="flex sm:hidden flex-col gap-4 px-2"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 p-2 w-full">
            <div className="relative aspect-[2/3] w-[84px] flex-shrink-0 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="flex flex-col justify-center gap-2 flex-grow">
              <div className="h-4 w-3/4 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-1/3 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-1/2 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

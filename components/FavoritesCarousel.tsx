import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { getAnimeBanner } from "@/lib/banners";
import { FavoritesCarouselClient } from "./FavoritesCarouselClient";

export async function FavoritesCarousel() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  // Query the watchlist items of type ANIME
  const items = await prisma.watchlistItem.findMany({
    where: {
      userId,
      mediaType: "ANIME",
    },
    orderBy: { createdAt: "desc" },
    include: {
      anime: {
        include: {
          seasons: {
            orderBy: { number: "asc" },
            take: 1,
            include: {
              episodes: {
                orderBy: { number: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  const favorites = items
    .filter((item) => item.anime !== null)
    .map((item) => item.anime!);

  if (favorites.length === 0) return null;

  // Resolve banners, episode images, ratings, and first episode IDs for each anime
  const resolvedItems = await Promise.all(
    favorites.map(async (anime) => {
      let banner = anime.bannerUrl;
      if (!banner) {
        banner = await getAnimeBanner(anime.id, anime.title);
      }
      const finalBannerUrl = banner === "none" ? null : banner;

      const firstEpisode = anime.seasons[0]?.episodes[0];
      const firstEpisodeId = firstEpisode?.id || null;
      const firstEpisodeImageUrl = firstEpisode?.imageUrl || null;

      return {
        id: anime.id,
        slug: anime.slug,
        title: anime.title,
        bannerUrl: finalBannerUrl || anime.imageUrl,
        firstEpisodeId,
        firstEpisodeImageUrl,
        rating: anime.rating,
        duration: anime.duration,
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

      <div
        className="flex gap-6 overflow-hidden pb-4"
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
    </section>
  );
}

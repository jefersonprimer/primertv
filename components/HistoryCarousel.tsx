import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory } from "@/lib/history";
import { HistoryCarouselClient } from "./HistoryCarouselClient";

export async function HistoryCarousel() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const items = await getAnimeWatchHistory(userId);

  if (items.length === 0) return null;

  const resolvedItems = items.slice(0, 4).map((item) => {
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

  return <HistoryCarouselClient items={resolvedItems} />;
}

export function HistoryCarouselSkeleton() {
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

      {/* Desktop/Tablet Skeleton Grid */}
      <div
        className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="relative aspect-video w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-3/4 animate-pulse bg-zinc-200 dark:bg-zinc-800 mt-1" />
            <div className="h-3 w-1/2 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Mobile Skeleton List - as it was originally */}
      <div
        className="flex sm:hidden flex-col gap-4 px-2"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 p-2 w-full">
            <div className="relative aspect-[2/3] w-[84px] flex-shrink-0 animate-pulse bg-zinc-800" />
            <div className="flex flex-col justify-center gap-2 flex-grow">
              <div className="h-4 w-3/4 animate-pulse bg-zinc-800" />
              <div className="h-3 w-1/3 animate-pulse dark:bg-zinc-800" />
              <div className="h-3 w-1/2 animate-pulse dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

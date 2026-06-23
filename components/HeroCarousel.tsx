import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { HeroCarouselClient } from "./HeroCarouselClient";

export async function HeroCarousel() {
  const animes = await prisma.anime.findMany({
    where: {
      bannerUrl: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      bannerUrl: true,
      imageUrl: true,
      logoUrl: true,
      genres: true,
      rating: true,
      seasons: {
        orderBy: { number: "asc" },
        select: {
          episodes: {
            orderBy: { number: "asc" },
            select: { id: true },
            take: 1,
          },
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const userId = await getAuthenticatedUserId();

  let watchlistAnimeIds = new Set<string>();
  if (userId) {
    const items = await prisma.watchlistItem.findMany({
      where: { userId, mediaType: "ANIME" },
      select: { animeId: true },
    });
    watchlistAnimeIds = new Set(items.map((i) => i.animeId).filter(Boolean) as string[]);
  }

  const items = animes.map((anime) => ({
    id: anime.id,
    slug: anime.slug,
    title: anime.title,
    description: anime.description,
    bannerUrl: anime.bannerUrl,
    imageUrl: anime.imageUrl,
    logoUrl: anime.logoUrl,
    genres: anime.genres,
    rating: anime.rating,
    firstEpisodeId: anime.seasons[0]?.episodes[0]?.id ?? null,
    inWatchlist: watchlistAnimeIds.has(anime.id),
  }));

  if (items.length === 0) return null;

  return <HeroCarouselClient items={items} isLoggedIn={Boolean(userId)} />;
}

export function HeroCarouselSkeleton() {
  return (
    <section className="relative h-[60vh] w-full overflow-hidden bg-zinc-900 md:h-[85vh]">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:hidden" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent hidden md:block" />
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />

      <div className="absolute inset-0 flex items-end pb-24 md:items-center md:pb-0">
        <div className="mx-auto w-full max-w-[1223px] px-4 md:px-8">
          <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left space-y-4 md:space-y-4 md:max-w-xl">
            <div className="flex justify-center md:justify-start">
              <div className="aspect-[3/1] w-full max-w-[200px] animate-pulse bg-zinc-700 md:max-w-[400px]" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="h-5 w-5 animate-pulse rounded bg-zinc-700" />
              <div className="h-4 w-48 animate-pulse rounded bg-zinc-700" />
            </div>

            <div className="hidden sm:block space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-700" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-700" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-700" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
              <div className="h-10 w-40 animate-pulse rounded bg-zinc-700 md:h-12 md:w-52" />
              <div className="h-10 w-10 animate-pulse rounded bg-zinc-700 md:h-12 md:w-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:bottom-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-1.5 animate-pulse rounded-full bg-zinc-700"
            style={{ width: i === 1 ? 48 : 12 }}
          />
        ))}
      </div>
    </section>
  );
}

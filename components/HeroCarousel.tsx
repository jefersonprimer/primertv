import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { HeroCarouselClient } from "./HeroCarouselClient";
import { getAnimeLogo, getSeriesLogo } from "@/lib/banners";
import { getMovieLogo } from "@/lib/tmdb";

export async function HeroCarousel({ type = "anime" }: { type?: "anime" | "series" | "movie" } = {}) {
  const isSeries = type === "series";
  const isMovie = type === "movie";

  const mediaList = isSeries
    ? await prisma.series.findMany({
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
      })
    : isMovie
      ? await prisma.movie.findMany({
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
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : await prisma.anime.findMany({
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

  let watchlistIds = new Set<string>();
  if (userId && !isMovie) {
    const items = await prisma.watchlistItem.findMany({
      where: { userId, mediaType: isSeries ? "SERIES" : "ANIME" },
      select: { animeId: true, seriesId: true },
    });
    watchlistIds = new Set(
      items.map((i) => (isSeries ? i.seriesId : i.animeId)).filter(Boolean) as string[],
    );
  }

  const items = await Promise.all(
    mediaList.map(async (media) => {
      let logoUrl = media.logoUrl;
      if (!logoUrl) {
        logoUrl = isSeries
          ? await getSeriesLogo(media.id, media.title)
          : isMovie
            ? await getMovieLogo(media.id, media.title)
            : await getAnimeLogo(media.id, media.title);
      }
      const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

      const seasons = (media as any).seasons;
      const firstEpisodeId = seasons?.[0]?.episodes?.[0]?.id ?? null;

      return {
        id: media.id,
        slug: media.slug,
        title: media.title,
        description: media.description,
        bannerUrl: media.bannerUrl,
        imageUrl: media.imageUrl,
        logoUrl: finalLogoUrl,
        genres: media.genres,
        rating: media.rating,
        firstEpisodeId,
        inWatchlist: watchlistIds.has(media.id),
        type,
      };
    })
  );

  if (items.length === 0) return null;

  return <HeroCarouselClient items={items} isLoggedIn={Boolean(userId)} />;
}

export function HeroCarouselSkeleton() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-zinc-900 md:h-[80vh] lg:h-screen">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:hidden" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-black/90 hidden md:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-zinc-50/50 to-transparent dark:from-black/50 hidden md:block" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />

      <div className="absolute inset-0 flex items-end pb-24 md:items-center md:pb-0">
        <div className="mx-auto w-full max-w-[1223px] md:px-10 lg:px-16 xl:px-0 lg:-translate-y-20">
          <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left space-y-4 md:max-w-xl">
            <div className="flex justify-center md:justify-start">
              <div className="aspect-[3/1] w-full max-w-[200px] animate-pulse bg-zinc-700 md:max-w-[400px]" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="h-5 w-5 animate-pulse bg-zinc-700" />
              <div className="h-4 w-48 animate-pulse bg-zinc-700" />
            </div>

            <div className="hidden lg:block space-y-2">
              <div className="h-4 w-full animate-pulse bg-zinc-700" />
              <div className="h-4 w-3/4 animate-pulse bg-zinc-700" />
              <div className="h-4 w-1/2 animate-pulse bg-zinc-700" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
              <div className="h-10 w-full max-w-[410px] animate-pulse bg-zinc-700 md:w-auto sm:max-w-none md:px-6" />
              <div className="h-10 w-10 animate-pulse bg-zinc-700 md:h-10 md:w-10" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 pt-4 md:pt-6 lg:pt-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-2 animate-pulse rounded-full bg-zinc-700"
                  style={{ width: i === 1 ? 48 : 24 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { HeroCarouselClient } from "./HeroCarouselClient";
import {
  getAnimeLogo,
  getSeriesLogo,
  getAnimeBanner,
  getSeriesBanner,
  getMovieBanner,
} from "@/lib/banners";
import { getMovieLogo } from "@/lib/tmdb";
import {
  FirstEpisodeRow,
  getFirstAnimeEpisodes,
  getFirstSeriesEpisodes,
} from "@/lib/media-performance";

type HeroCarouselMedia = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  genres: string[];
  rating: string | null;
  videoUrl?: string | null;
  tmdbId?: string | null;
  publicId?: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
};

export async function HeroCarousel({
  type = "anime",
}: { type?: "anime" | "series" | "movie" } = {}) {
  const isSeries = type === "series";
  const isMovie = type === "movie";

  const mediaList: HeroCarouselMedia[] = isSeries
    ? await prisma.series.findMany({
        where: {
          bannerUrl: { not: "none" },
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
    : isMovie
      ? await prisma.movie.findMany({
          where: {
            bannerUrl: { not: "none" },
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
            videoUrl: true,
            tmdbId: true,
            publicId: true,
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : await prisma.anime.findMany({
          where: {
            bannerUrl: { not: "none" },
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
            isDubbed: true,
            isSubtitled: true,
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        });

  const userId = await getAuthenticatedUserId();
  const mediaIds = mediaList.map((media) => media.id);

  const [watchlistIds, firstEpisodeByMediaId] = await Promise.all([
    userId && !isMovie && mediaIds.length > 0
      ? prisma.watchlistItem
          .findMany({
            where: {
              userId,
              mediaType: isSeries ? "SERIES" : "ANIME",
              ...(isSeries
                ? { seriesId: { in: mediaIds } }
                : { animeId: { in: mediaIds } }),
            },
            select: isSeries ? { seriesId: true } : { animeId: true },
          })
          .then((items: any[]) => {
            return new Set(
              items
                .map((item) => (isSeries ? item.seriesId : item.animeId))
                .filter(Boolean) as string[],
            );
          })
      : Promise.resolve(new Set<string>()),
    isMovie
      ? Promise.resolve(new Map<string, FirstEpisodeRow>())
      : isSeries
        ? getFirstSeriesEpisodes(mediaIds)
        : getFirstAnimeEpisodes(mediaIds),
  ]);

  const firstEpisodeIds = Array.from(firstEpisodeByMediaId.values())
    .map((row) => row.firstEpisodeId)
    .filter(Boolean) as string[];

  const episodeDetails = !isMovie
    ? isSeries
      ? firstEpisodeIds.length > 0
        ? await prisma.seriesEpisode.findMany({
            where: { id: { in: firstEpisodeIds } },
            select: { id: true, publicId: true, slug: true, number: true },
          })
        : []
      : firstEpisodeIds.length > 0
        ? await prisma.episode.findMany({
            where: { id: { in: firstEpisodeIds } },
            select: { id: true, publicId: true, slug: true, number: true },
          })
        : []
    : [];

  const episodeDetailsMap = new Map(episodeDetails.map((ep) => [ep.id, ep]));

  const items = await Promise.all(
    mediaList.map(async (media) => {
      let bannerUrl = media.bannerUrl;
      if (!bannerUrl) {
        bannerUrl = isSeries
          ? await getSeriesBanner(media.id, media.title)
          : isMovie
            ? await getMovieBanner(media.id, media.title)
            : await getAnimeBanner(media.id, media.title);
      }
      const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

      let logoUrl = media.logoUrl;
      if (!logoUrl) {
        logoUrl = isSeries
          ? await getSeriesLogo(media.id, media.title)
          : isMovie
            ? await getMovieLogo(media.id, media.title)
            : await getAnimeLogo(media.id, media.title);
      }
      const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

      const firstEpisodeId =
        firstEpisodeByMediaId.get(media.id)?.firstEpisodeId ?? null;

      const epDetails = firstEpisodeId
        ? episodeDetailsMap.get(firstEpisodeId)
        : null;
      const firstEpisodePublicId = epDetails?.publicId ?? null;
      const firstEpisodeSlug = epDetails
        ? epDetails.slug || `episode-${epDetails.number}`
        : null;

      return {
        id: media.id,
        slug: media.slug,
        title: media.title,
        description: media.description,
        bannerUrl: finalBannerUrl,
        imageUrl: media.imageUrl,
        logoUrl: finalLogoUrl,
        genres: media.genres,
        rating: media.rating,
        firstEpisodeId,
        firstEpisodePublicId,
        firstEpisodeSlug,
        inWatchlist: watchlistIds.has(media.id),
        type,
        videoUrl: media.videoUrl ?? null,
        tmdbId: media.tmdbId ?? null,
        publicId: media.publicId ?? null,
        isDubbed: media.isDubbed ?? false,
        isSubtitled: media.isSubtitled ?? false,
      };
    }),
  );

  if (items.length === 0) return null;

  return <HeroCarouselClient items={items} isLoggedIn={Boolean(userId)} />;
}

export function HeroCarouselSkeleton() {
  return (
    <section className="relative h-[95vh] lg:h-screen 2xl:h-[calc(100vh-4rem)] w-full overflow-hidden bg-zinc-900">
      <style>{`
        @media (max-width: 639px) {
          .mobile-bottom-blur {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 480px;
            pointer-events: none;
            background: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.8) 100%, rgba(0, 0, 0, 0.15) 75%, transparent 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            mask-image: linear-gradient(to top, black 25%, transparent 100%);
            -webkit-mask-image: linear-gradient(to top, black 25%, transparent 100%);
          }
        }
      `}</style>

      {/* Mobile gradient overlay for poster readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent md:hidden" />
      {/* Left Gradient */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-zinc-50 via-zinc-50/75 to-transparent dark:from-black dark:via-black/75 hidden md:block" />
      {/* Right Gradient */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[20%] bg-gradient-to-l from-zinc-50 via-zinc-50/75 to-transparent dark:from-black dark:via-black/75 hidden md:block" />
      {/* Bottom Gradient for sm and larger */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-68 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black hidden sm:block" />

      {/* Mobile bottom blur & gradient overlay for screens < sm */}
      <div className="mobile-bottom-blur sm:hidden" />

      <div className="absolute inset-0 flex items-end pb-30 sm:pb-14 md:pb-[24px] md:items-center">
        <div className="mx-auto w-full max-w-[1223px] 2xl:max-w-[1500px] md:px-10 lg:px-16 xl:px-0 2xl:px-12 lg:-translate-y-6 2xl:-translate-y-16">
          <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left space-y-4 md:max-w-xl 2xl:max-w-2xl 2xl:space-y-6">
            <div className="aspect-[3/1] w-full max-w-[200px] sm:max-w-[280px] md:max-w-[340px] lg:max-w-[400px] 2xl:max-w-[480px] mx-auto md:mx-0 animate-pulse rounded-lg bg-zinc-800" />

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 2xl:gap-2">
              <div className="h-5 w-9 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-800" />
            </div>

            <div className="hidden lg:block space-y-2 max-w-[380px] 2xl:max-w-[540px]">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-800" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-800" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 2xl:gap-4 pt-1 2xl:pt-2">
              <div className="h-11 md:h-12 w-full max-w-[340px] md:w-[180px] 2xl:w-[210px] rounded-full animate-pulse bg-zinc-800" />
              <div className="h-11 w-11 md:h-12 md:w-12 rounded-full animate-pulse bg-zinc-800 shrink-0" />
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 pt-4 md:pt-6 lg:pt-8 2xl:pt-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-2 2xl:h-2.5 animate-pulse rounded-full bg-zinc-800"
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

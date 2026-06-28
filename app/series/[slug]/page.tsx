import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Play, Star } from "lucide-react";

import SeasonSelector from "@/components/SeasonSelector";
import MediaDescricao from "@/components/MediaDescricao";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";
import AddToListButton from "@/components/AddToListButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { MediaCarousel } from "@/components/MediaCarousel";
import { getSeriesBanner, getSeriesLogo } from "@/lib/banners";

export const revalidate = 3600;

interface SeriesDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SeriesDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const serie = await prisma.series.findUnique({ where: { slug } });

  if (!serie) return { title: "Série não encontrada" };

  let bannerUrl = serie.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getSeriesBanner(serie.id, serie.title);
  }
  const ogBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const ogImages = [];
  if (ogBannerUrl) ogImages.push(ogBannerUrl);
  if (serie.imageUrl) ogImages.push(serie.imageUrl);

  return {
    title: `Assistir ${serie.title} Online em HD - Primerflix`,
    description: `Assista à série ${serie.title} online grátis em HD no PrimerTv.`,
    openGraph: {
      title: serie.title,
      images: ogImages,
    },
  };
}

export default async function SeriesDetailsPage({
  params,
}: SeriesDetailsPageProps) {
  const { slug } = await params;

  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      seasons: {
        orderBy: { number: "asc" },
        include: {
          episodes: {
            orderBy: { number: "asc" },
          },
        },
      },
    },
  });

  if (!series) {
    notFound();
  }

  let bannerUrl = series.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getSeriesBanner(series.id, series.title);
  }
  const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  let logoUrl = series.logoUrl;
  if (!logoUrl || logoUrl === "none") {
    logoUrl = await getSeriesLogo(series.id, series.title);
  }
  const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

  const firstEpisodeId = series.seasons[0]?.episodes[0]?.id;
  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("SERIES", series.id);

  const similarSeries =
    series.genres && series.genres.length > 0
      ? await prisma.series.findMany({
          where: {
            genres: {
              hasSome: series.genres,
            },
            id: {
              not: series.id,
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
          },
          take: 15,
        })
      : [];

  const mappedSeasons = series.seasons.map((season) => ({
    ...season,
    episodes: season.episodes.map((ep) => ({
      ...ep,
      imageUrl: series.imageUrl,
    })),
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Hero Section */}
      <div className="relative md:min-h-[85vh] w-full md:flex md:flex-col md:justify-end">
        {/* Banner Section */}
        <div className="absolute inset-0 hidden md:block bg-zinc-900 overflow-hidden">
          {finalBannerUrl ? (
            <Image
              src={finalBannerUrl}
              alt={series.title}
              fill
              sizes="100vw"
              className="object-cover opacity-100"
              priority
            />
          ) : (
            series.imageUrl && (
              <Image
                src={series.imageUrl}
                alt={series.title}
                fill
                sizes="100vw"
                className="object-cover opacity-100"
                priority
              />
            )
          )}
          {/* Bottom Gradient (fades to page bg) */}
          <div className="absolute bottom-0 left-0 right-0 h-68 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />
          {/* Left Gradient (occupies 40% of the width, fading softer to transparent) */}
          <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-black/80" />
          {/* Right Gradient (occupies 10% of the width, fading to transparent) */}
          <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-zinc-50/50 to-transparent dark:from-black/50" />
        </div>

        {/* Content Container */}
        <div className="mx-auto max-w-[1223px] w-full relative z-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end">
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full self-center overflow-hidden shadow-2xl md:hidden flex-shrink-0">
              {series.imageUrl ? (
                <Image
                  src={series.imageUrl}
                  alt={series.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 240px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  Sem imagem
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="relative z-10 flex flex-1 flex-col gap-4 md:gap-8 -mt-70 md:mt-0 py-6 px-4 md:p-0 w-full">
              {/* Mobile Background with Gradient Mask to fade out the top boundary line */}
              <div
                className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-50/20 via-zinc-50/85 to-zinc-50 dark:from-black/20 dark:via-black/85 dark:to-black backdrop-blur-[3px] rounded-t-2xl md:hidden"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent, black 120px)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 120px)",
                }}
              />
              <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left w-full md:max-w-2xl">
                {finalLogoUrl ? (
                  <div className="relative w-full max-w-[280px] md:max-w-[400px] aspect-[3/1] mb-2 flex items-center justify-center md:justify-start">
                    <Image
                      src={finalLogoUrl}
                      alt={series.title}
                      fill
                      priority
                      className="object-contain object-center md:object-left"
                    />
                    <h1 className="sr-only">{series.title}</h1>
                  </div>
                ) : (
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-[34px] line-clamp-2 max-w-[380px]">
                    {series.title}
                  </h1>
                )}

                <div className="mt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  {series.score !== null && series.score !== undefined && (
                    <div
                      title={`Nota #${series.score.toFixed(1)} no IMDb`}
                      className="inline-flex items-center rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 text-xs font-bold shadow-sm cursor-help"
                    >
                      <span className="bg-[#f5c518] px-2 py-1.5 text-black uppercase tracking-wider text-[10px] leading-none">
                        IMDb
                      </span>
                      <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-1.5 flex items-center gap-1 leading-none">
                        {series.score.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {(series.rating ||
                  (series.genres && series.genres.length > 0)) && (
                  <div className="mt-2 flex items-center justify-center md:justify-start flex-wrap gap-2">
                    {series.rating && (
                      <RatingBadge rating={series.rating} className="h-5 w-5" />
                    )}
                    {series.rating &&
                      series.genres &&
                      series.genres.length > 0 && (
                        <span
                          className="text-zinc-400 dark:text-zinc-600 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <svg
                            className="h-2 w-2 fill-current"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2L22 12L12 22L2 12Z" />
                          </svg>
                        </span>
                      )}
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {series.genres?.map((genre, index) => (
                        <span key={genre}>
                          <span className="underline">{genre}</span>
                          {index < series.genres.length - 1 && ", "}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {series.score !== null && series.score !== undefined && (
                  <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                    <div className="flex items-center gap-0.5">
                      <svg aria-hidden="true" className="absolute w-0 h-0">
                        <defs>
                          <linearGradient
                            id="star-gradient"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#ACD4FE" />
                            <stop offset="50%" stopColor="#8DB4F5" />
                            <stop offset="100%" stopColor="#85AEF3" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {Array.from({ length: 10 }).map((_, i) => {
                        const isFilled = i < Math.round(series.score || 0);
                        return (
                          <Star
                            key={i}
                            className={`h-7 w-7 ${
                              isFilled
                                ? "text-[#8DB4F5]"
                                : "text-zinc-300 dark:text-zinc-400"
                            }`}
                            fill={isFilled ? "url(#star-gradient)" : "none"}
                          />
                        );
                      })}
                    </div>
                    <div className="h-4 border border-zinc-600" />
                    <span className="text-sm font-semibold text-white gap-2">
                      {series.score.toFixed(1)}/10
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  {firstEpisodeId && (
                    <Link
                      href={`/series/${series.slug}/episode/${firstEpisodeId}`}
                      className="flex h-10 flex-1 items-center justify-center gap-2 bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 md:h-auto md:flex-initial md:px-4 md:py-2 md:w-fit"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      Começar a assistir EP1
                    </Link>
                  )}
                  <WatchlistButton
                    mediaType="SERIES"
                    mediaId={series.id}
                    slug={series.slug}
                    initialInWatchlist={inWatchlist}
                    isLoggedIn={Boolean(userId)}
                  />
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                  <AddToListButton
                    seriesId={series.id}
                    isLoggedIn={Boolean(userId)}
                  />
                  <ShareButton />
                </div>
              </div>

              {series.description && (
                <div className="mt-4 w-full">
                  <MediaDescricao
                    description={series.description}
                    rating={series.rating || undefined}
                    genres={series.genres}
                    year={series.year}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <main className="mx-auto max-w-[1240px] pb-12 px-4 md:px-0">
        {series.seasons.length === 0 ? (
          <p className="text-zinc-500">Nenhum episódio encontrado.</p>
        ) : (
          <SeasonSelector
            seasons={mappedSeasons}
            animeSlug={series.slug}
            animeTitle={series.title}
            animeRating={series.rating}
            baseUrl={`/series/${series.slug}/episode`}
          />
        )}
      </main>

      {/* Similar Series Carousel */}
      {similarSeries.length > 0 && (
        <div className="pl-2 lg:pl-0 pb-12">
          <MediaCarousel
            title="Séries Semelhantes"
            subtitle="Baseado nos gêneros desta série"
            items={similarSeries}
            type="series"
          />
        </div>
      )}
    </div>
  );
}

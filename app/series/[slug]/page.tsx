import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import EpisodeList from "@/components/EpisodeList";
import MediaDescricao from "@/components/MediaDescricao";
import { Metadata } from "next";
import { getSeriesBanner, getSeriesLogo } from "@/lib/banners";
import { WatchlistButton } from "@/components/WatchlistButton";
import AddToListButton from "@/components/AddToListButton";
import ShareButton from "@/components/ShareButton";
import { MediaCarousel } from "@/components/MediaCarousel";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header/Banner Section */}
      <div className="relative md:min-h-[90vh] w-full flex flex-col justify-end overflow-hidden bg-zinc-900">
        {finalBannerUrl ? (
          <Image
            src={finalBannerUrl}
            alt={series.title}
            fill
            sizes="100vw"
            className="object-cover opacity-100 hidden md:block"
            priority
          />
        ) : (
          series.imageUrl && (
            <Image
              src={series.imageUrl}
              alt={series.title}
              fill
              sizes="100vw"
              className="object-cover opacity-100 hidden md:block"
              priority
            />
          )
        )}
        {/* Bottom Gradient (fades to page bg) */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />
        {/* Left Gradient (occupies 40% of the width, fading softer to transparent) */}
        <div className="absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-black/80" />
        {/* Right Gradient (occupies 10% of the width, fading to transparent) */}
        <div className="absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-zinc-50/50 to-transparent dark:from-black/50" />

        <div className="relative w-full z-10">
          <div className="mx-auto flex max-w-[1223px] flex-col gap-6 md:flex-row md:items-end">
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
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl text-center md:text-left">
                    {series.title}
                  </h1>
                )}
                {series.score !== null && series.score !== undefined && (
                  <div className="flex items-center gap-1.5 justify-center md:justify-start mt-2">
                    <span className="rounded bg-[#f5c518] px-1.5 py-0.5 text-xs font-bold text-black leading-none">
                      IMDb
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {series.score.toFixed(1)}
                      <span className="text-zinc-400">/10</span>
                    </span>
                  </div>
                )}
                {series.genres && series.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                    {series.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                <WatchlistButton
                  mediaType="SERIES"
                  mediaId={series.id}
                  slug={series.slug}
                  initialInWatchlist={inWatchlist}
                  isLoggedIn={Boolean(userId)}
                  hasBorder={true}
                  roundedFull={true}
                />
                <AddToListButton
                  seriesId={series.id}
                  isLoggedIn={Boolean(userId)}
                  hasBorder={true}
                  roundedFull={true}
                />
                <ShareButton hasBorder={true} roundedFull={true} />
              </div>
              {series.description && (
                <div className="w-full">
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
      <main className="mx-auto max-w-[1223px]">
        <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Episódios
        </h2>

        {series.seasons.length === 0 ? (
          <p className="text-zinc-500">Nenhum episódio encontrado.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {series.seasons.map((season) => (
              <section key={season.id}>
                {series.seasons.length > 1 && (
                  <h3 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                    Temporada {season.number}
                  </h3>
                )}

                <EpisodeList
                  items={season.episodes}
                  baseUrl={`/series/${series.slug}/episode`}
                  itemType="episode"
                  animeTitle={series.title}
                />
              </section>
            ))}
          </div>
        )}
      </main>

      {similarSeries.length > 0 && (
        <div className="py-12">
          <MediaCarousel
            title="Recomendados"
            subtitle="Baseado nos gêneros desta série"
            items={similarSeries}
            type="series"
          />
        </div>
      )}
    </div>
  );
}

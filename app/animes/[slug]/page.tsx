import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Play, Star, Trophy } from "lucide-react";

import SeasonSelector from "@/components/SeasonSelector";
import MediaDescricao from "@/components/MediaDescricao";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";
import AddToListButton from "@/components/AddToListButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { MediaCarousel } from "@/components/MediaCarousel";
import { getAnimeBanner, getAnimeLogo } from "@/lib/banners";

export const revalidate = 3600;

function formatMembers(num: number | null | undefined): string {
  if (num === null || num === undefined) return "";
  const formatted = new Intl.NumberFormat("pt-BR").format(num);
  if (num >= 1000000) {
    return `${formatted}M`;
  }
  if (num >= 1000) {
    return `${formatted}K`;
  }
  return formatted;
}

interface AnimeDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: AnimeDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const anime = await prisma.anime.findUnique({ where: { slug } });

  if (!anime) return { title: "Anime não encontrado" };

  let bannerUrl = anime.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getAnimeBanner(anime.id, anime.title);
  }
  const ogBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const ogImages = [];
  if (ogBannerUrl) ogImages.push(ogBannerUrl);
  if (anime.imageUrl) ogImages.push(anime.imageUrl);

  return {
    title: `Assistir ${anime.title} Online em HD - PrimerTv`,
    description: `Assista ao anime ${anime.title} online grátis em HD no PrimerTv.`,
    openGraph: {
      title: anime.title,
      images: ogImages,
    },
  };
}

export default async function AnimeDetailsPage({
  params,
}: AnimeDetailsPageProps) {
  const { slug } = await params;

  const anime = await prisma.anime.findUnique({
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

  if (!anime) {
    notFound();
  }

  let bannerUrl = anime.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getAnimeBanner(anime.id, anime.title);
  }
  const finalBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  let logoUrl = anime.logoUrl;
  if (!logoUrl) {
    logoUrl = await getAnimeLogo(anime.id, anime.title);
  }
  const finalLogoUrl = logoUrl === "none" ? null : logoUrl;

  const firstEpisodeId = anime.seasons[0]?.episodes[0]?.id;
  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("ANIME", anime.id);

  const similarAnimes =
    anime.genres && anime.genres.length > 0
      ? await prisma.anime.findMany({
          where: {
            genres: {
              hasSome: anime.genres,
            },
            id: {
              not: anime.id,
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
      {/* Hero Section */}
      <div className="relative md:min-h-[85vh] w-full md:flex md:flex-col md:justify-end">
        {/* Banner Section */}
        <div className="absolute inset-0 hidden md:block bg-zinc-900 overflow-hidden">
          {finalBannerUrl ? (
            <Image
              src={finalBannerUrl}
              alt={anime.title}
              fill
              sizes="100vw"
              className="object-cover opacity-100"
              priority
            />
          ) : (
            anime.imageUrl && (
              <Image
                src={anime.imageUrl}
                alt={anime.title}
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
              {anime.imageUrl ? (
                <Image
                  src={anime.imageUrl}
                  alt={anime.title}
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
                      alt={anime.title}
                      fill
                      priority
                      className="object-contain object-center md:object-left"
                    />
                    <h1 className="sr-only">{anime.title}</h1>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 w-full items-center md:items-start">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-[34px] line-clamp-2 max-w-[380px]">
                      {anime.title}
                    </h1>
                    {anime.titleEnglish && (
                      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-[380px]">
                        {anime.titleEnglish}
                      </h2>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  {anime.rank !== null && anime.rank !== undefined && (
                    <div
                      title={`Top #${anime.rank} no ranking do MyAnimeList.net`}
                      className="inline-flex items-center rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 text-xs font-bold shadow-sm cursor-help"
                    >
                      <span className="bg-[#2E51A2] px-2 py-1.5 text-white uppercase tracking-wider text-[10px] leading-none">
                        MAL
                      </span>
                      <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-1.5 flex items-center gap-1 leading-none">
                        #{anime.rank}
                      </span>
                    </div>
                  )}

                  {anime.awards &&
                    anime.awards.length > 0 &&
                    (() => {
                      const winningAwards = anime.awards.filter((award) =>
                        award.toLowerCase().includes("winner"),
                      );
                      if (winningAwards.length === 0) return null;
                      return (
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-1.5 rounded border border-amber-500/30 text-xs font-bold shadow-sm transition hover:scale-105 duration-200">
                          <Image
                            src="/anime_award_icon.png"
                            alt="Award Icon"
                            width={14}
                            height={14}
                            className="object-contain"
                          />
                          <span className="text-amber-700 dark:text-amber-400 leading-none">
                            {winningAwards.join(", ")}
                          </span>
                        </div>
                      );
                    })()}
                </div>

                {(anime.rating ||
                  (anime.genres && anime.genres.length > 0)) && (
                  <div className="mt-2 flex items-center justify-center md:justify-start flex-wrap gap-2">
                    {anime.rating && (
                      <RatingBadge rating={anime.rating} className="h-5 w-5" />
                    )}
                    {anime.rating &&
                      anime.genres &&
                      anime.genres.length > 0 && (
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
                      {anime.genres?.map((genre, index) => (
                        <span key={genre}>
                          <span className="underline">{genre}</span>
                          {index < anime.genres.length - 1 && ", "}
                        </span>
                      ))}
                    </span>
                  </div>
                )}

                {anime.score !== null && anime.score !== undefined && (
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
                        const isFilled = i < Math.round(anime.score || 0);
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
                      {anime.score.toFixed(1)} ({formatMembers(anime.members)})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  {firstEpisodeId && (
                    <Link
                      href={`/animes/${anime.slug}/episode/${firstEpisodeId}`}
                      className="flex h-10 flex-1 items-center justify-center gap-2 bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 md:h-auto md:flex-initial md:px-4 md:py-2 md:w-fit"
                    >
                      <Play className="h-5 w-5 fill-current" />
                      Começar a assistir EP1
                    </Link>
                  )}
                  <WatchlistButton
                    mediaType="ANIME"
                    mediaId={anime.id}
                    slug={anime.slug}
                    initialInWatchlist={inWatchlist}
                    isLoggedIn={Boolean(userId)}
                  />
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                  <AddToListButton
                    animeId={anime.id}
                    isLoggedIn={Boolean(userId)}
                  />
                  <ShareButton />
                </div>
              </div>

              {anime.description && (
                <div className="mt-4 w-full">
                  <MediaDescricao
                    description={anime.description}
                    rating={anime.rating || undefined}
                    genres={anime.genres}
                    awards={anime.awards}
                    audio={anime.audio}
                    subtitles={anime.subtitles}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <main className="mx-auto max-w-[1240px] pb-12 px-4 md:px-0">
        {anime.seasons.length === 0 ? (
          <p className="text-zinc-500">Nenhum episódio encontrado.</p>
        ) : (
          <SeasonSelector
            seasons={anime.seasons}
            animeSlug={anime.slug}
            animeTitle={anime.title}
            animeRating={anime.rating}
            animeDuration={anime.duration}
          />
        )}
      </main>

      {/* Similar Animes Carousel */}
      {similarAnimes.length > 0 && (
        <div className="pl-2 lg:pl-0 pb-12">
          <MediaCarousel
            title="Animes Semelhantes"
            subtitle="Baseado nos gêneros deste anime"
            items={similarAnimes}
            type="anime"
          />
        </div>
      )}
    </div>
  );
}

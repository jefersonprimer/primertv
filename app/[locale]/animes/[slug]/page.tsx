import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import SeasonSelector from "@/components/SeasonSelector";
import MediaDescription from "@/components/MediaDescription";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import ShareButton from "@/components/ShareButton";
import AddToListButton from "@/components/AddToListButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import { MediaCarousel } from "@/components/MediaCarousel";
import { getAnimeBanner, getAnimeLogo } from "@/lib/banners";
import { getSession } from "@/lib/auth";
import { EditMediaButton } from "@/components/admin/EditMediaButton";
import { getFirstAnimeEpisodes } from "@/lib/media-performance";
import { DeleteAnimeButton } from "@/components/admin/DeleteAnimeButton";
import { getAnimeDetailsBySlug } from "@/lib/media-details";
import { StartWatchingButton } from "@/components/StartWatchingButton";
import {
  getMegaPlayAnimeCatalog,
  type MegaPlayCatalogEpisode,
} from "@/lib/anikoto";

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
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: AnimeDetailsPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const anime = await getAnimeDetailsBySlug(slug);
  const t = await getTranslations({ locale, namespace: "AnimeDetails" });

  if (!anime) return { title: t("notFound") };

  let bannerUrl = anime.bannerUrl;
  if (!bannerUrl) {
    bannerUrl = await getAnimeBanner(anime.id, anime.title);
  }
  const ogBannerUrl = bannerUrl === "none" ? null : bannerUrl;

  const ogImages = [];
  if (ogBannerUrl) ogImages.push(ogBannerUrl);
  if (anime.imageUrl) ogImages.push(anime.imageUrl);

  return {
    title: t("metaTitle", { title: anime.title }),
    description: t("metaDescription", { title: anime.title }),
    openGraph: {
      title: anime.title,
      images: ogImages,
    },
  };
}

export default async function AnimeDetailsPage({
  params,
}: AnimeDetailsPageProps) {
  const t = await getTranslations("AnimeDetails");
  const tMedia = await getTranslations("MediaCard");
  const { slug } = await params;
  const anime = await getAnimeDetailsBySlug(slug);

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

  const firstEpisodeId =
    (await getFirstAnimeEpisodes([anime.id])).get(anime.id)?.firstEpisodeId ??
    null;

  let firstEpisodeLink = null;
  if (firstEpisodeId) {
    const firstEp = await prisma.episode.findUnique({
      where: { id: firstEpisodeId },
      select: { publicId: true, slug: true, number: true },
    });
    if (firstEp && firstEp.publicId) {
      firstEpisodeLink = `/watch/${firstEp.publicId}/${firstEp.slug || "episode-" + firstEp.number}`;
    } else {
      firstEpisodeLink = `/watch/${firstEpisodeId}`;
    }
  }
  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("ANIME", anime.id);
  const session = await getSession();
  const isAdmin = session?.user?.role === "admin";

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
            isDubbed: true,
            isSubtitled: true,
          },
          take: 15,
        })
      : [];

  const totalEpisodes = anime.seasons.reduce(
    (acc, season) => acc + (season.episodes?.length || 0),
    0,
  );

  const externalSourceKey = JSON.stringify({
    anilistId: anime.anilistId,
    malId: anime.malId,
    title: anime.title,
    titleEnglish: anime.titleEnglish,
    slug: anime.slug,
  });

  const externalCatalog =
    totalEpisodes === 0 || anime.anilistId || anime.malId
      ? await getMegaPlayAnimeCatalog(externalSourceKey)
      : null;

  const mergedSeasons = buildMergedSeasons({
    animeSlug: anime.slug,
    animeTitle: anime.title,
    localSeasons: anime.seasons,
    externalEpisodes: externalCatalog?.episodes || [],
    translateEpisode: (num: number) => t("episodeNumber", { number: num }),
  });

  const externalFirstEpisodeLink =
    mergedSeasons[0]?.episodes[0]?.href ||
    (anime.anilistId || anime.malId
      ? `/watch/${anime.slug}/episode-1?source=megaplay&episode=1`
      : null);

  if (!firstEpisodeLink && externalFirstEpisodeLink) {
    firstEpisodeLink = externalFirstEpisodeLink;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative md:min-h-[90vh]  w-full md:flex md:flex-col md:justify-end">
        {/* Banner Section */}
        <div className="absolute top-0 left-0 right-0 h-[90vh] hidden md:block bg-zinc-900 overflow-hidden">
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
                  {t("noImage")}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="relative z-10 flex flex-1 flex-col gap-4 md:gap-8 -mt-70 md:mt-0 py-6 px-4 md:p-0 w-full">
              {/* Mobile Background: borderless subtle gradient from transparent to black */}
              <div
                className="absolute inset-x-0 bottom-0 -top-[6px] -z-10 md:hidden"
                style={
                  {
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0.5) 50px, rgba(0, 0, 0, 0.8) 140px, #000 260px)",
                  } as React.CSSProperties
                }
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
                    <h1 className="text-2xl font-bold text-zinc-50 md:text-zinc-900 md:dark:text-zinc-50 md:text-[34px] line-clamp-2 max-w-[380px]">
                      {anime.title}
                    </h1>
                    {anime.titleEnglish && (
                      <h2 className="text-sm font-medium text-zinc-400 md:text-zinc-500 md:dark:text-zinc-400 line-clamp-1 max-w-[380px]">
                        {anime.titleEnglish}
                      </h2>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                  {anime.rank !== null &&
                    anime.rank !== undefined &&
                    anime.rank <= 1000 && (
                      <div
                        title={t("malTitle", {
                          rank: anime.rank ?? 0,
                          score: anime.score ?? 0,
                          members: formatMembers(anime.members),
                        })}
                        className="inline-flex items-center overflow-hidden text-xs font-bold shadow-sm cursor-help"
                      >
                        <span className="bg-[#2E51A2] px-2 py-1.5 text-white uppercase tracking-wider text-[10px] leading-none">
                          MAL
                        </span>
                        <span className="bg-zinc-900 md:bg-zinc-100 md:dark:bg-zinc-900 text-zinc-200 md:text-zinc-800 md:dark:text-zinc-200 px-2 py-1.5 flex items-center gap-1 leading-none">
                          #{anime.rank}
                        </span>
                        {anime.score !== null && anime.score !== undefined && (
                          <div className="px-2 hidden sm:flex">
                            <span className="text-sm font-semibold text-white gap-2">
                              {anime.score.toFixed(1)} (
                              {formatMembers(anime.members)})
                            </span>
                          </div>
                        )}
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
                  (anime.genres && anime.genres.length > 0) ||
                  anime.isDubbed ||
                  anime.isSubtitled) && (
                  <div className="mt-2 flex items-center justify-center md:justify-start flex-wrap gap-1.5">
                    {anime.rating && (
                      <RatingBadge rating={anime.rating} className="h-5 w-5" />
                    )}
                    {(anime.isDubbed || anime.isSubtitled) && (
                      <>
                        {anime.rating && (
                          <span
                            className="text-[#bbb] flex items-center justify-center"
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
                        <div className="flex gap-1.5 items-center">
                          {anime.isDubbed && anime.isSubtitled ? (
                            <span className="text-sm text-[#8c8c8c] font-normal">
                              {tMedia("subDub")}
                            </span>
                          ) : anime.isDubbed ? (
                            <span className="text-sm text-[#8c8c8c] font-normal">
                              {tMedia("dubbed")}
                            </span>
                          ) : (
                            <span className="text-sm text-[#8c8c8c] font-normal">
                              {tMedia("subtitled")}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    {((anime.rating || anime.isDubbed || anime.isSubtitled) &&
                      anime.genres &&
                      anime.genres.length > 0) && (
                        <span
                          className="text-[#bbb] flex items-center justify-center"
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
                    <span className="text-xs font-medium text-zinc-300 md:text-zinc-700 md:dark:text-zinc-300">
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
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                  {firstEpisodeLink && (
                    <StartWatchingButton
                      href={firstEpisodeLink}
                      className="flex-1 md:h-auto md:flex-initial md:px-4 md:py-2.5 md:w-fit text-sm"
                    />
                  )}
                  <WatchlistButton
                    mediaType="ANIME"
                    mediaId={anime.id}
                    slug={anime.slug}
                    initialInWatchlist={inWatchlist}
                    isLoggedIn={Boolean(userId)}
                  />
                </div>
                <div className="flex flex-row items-center gap-6 md:gap-3 w-full md:w-auto justify-center md:justify-start">
                  <AddToListButton
                    animeId={anime.id}
                    isLoggedIn={Boolean(userId)}
                    mobileVertical={true}
                  />
                  <ShareButton mobileVertical={true} />
                  {isAdmin && (
                    <div className="flex items-center gap-3">
                      <EditMediaButton
                        collection="animes"
                        item={anime}
                        className="flex h-10 items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors md:h-auto md:py-2.5 uppercase"
                      />
                      <DeleteAnimeButton
                        animeId={anime.id}
                        animeSlug={anime.slug}
                        className="flex h-10 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-950 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30 md:h-auto md:py-2.5 uppercase"
                        redirectTo="/animes"
                      />
                    </div>
                  )}
                </div>
              </div>

              {anime.description && (
                <div className="mt-4 w-full">
                  <MediaDescription
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
        {mergedSeasons.length > 0 ? (
          <SeasonSelector
            seasons={mergedSeasons}
            animeSlug={anime.slug}
            animeTitle={anime.title}
            animeRating={anime.rating}
            animeDuration={anime.duration}
            fallbackImageUrl={finalBannerUrl || anime.imageUrl}
            isDubbed={anime.isDubbed}
            isSubtitled={anime.isSubtitled}
          />
        ) : totalEpisodes === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
              {t("episodesSoon")}
            </p>
            {externalFirstEpisodeLink && (
              <StartWatchingButton
                href={externalFirstEpisodeLink}
                text={t("openMegaPlay")}
              />
            )}
          </div>
        ) : (
          <SeasonSelector
            seasons={anime.seasons}
            animeSlug={anime.slug}
            animeTitle={anime.title}
            animeRating={anime.rating}
            animeDuration={anime.duration}
            isDubbed={anime.isDubbed}
            isSubtitled={anime.isSubtitled}
          />
        )}
      </main>

      {/* Similar Animes Carousel */}
      {similarAnimes.length > 0 && (
        <div className="pl-2 lg:pl-0 pb-12">
          <MediaCarousel
            title={t("similarTitle")}
            subtitle={t("similarSubtitle")}
            items={similarAnimes}
            type="anime"
          />
        </div>
      )}
    </div>
  );
}

type LocalSeason = {
  id: string;
  number: number;
  episodes: Array<{
    id: string;
    number: number;
    title: string | null;
    slug: string | null;
    publicId: string | null;
    videoUrl: string | null;
    imageUrl: string | null;
  }>;
};

type MergedEpisode = {
  id: string;
  number: number;
  title: string | null;
  href: string;
  videoUrl: string | null;
  imageUrl: string | null;
  publicId: string | null;
  slug: string | null;
};

type MergedSeason = {
  id: string;
  number: number;
  episodes: MergedEpisode[];
};

function buildMergedSeasons({
  animeSlug,
  animeTitle,
  localSeasons,
  externalEpisodes,
  translateEpisode,
}: {
  animeSlug: string;
  animeTitle: string;
  localSeasons: LocalSeason[];
  externalEpisodes: MegaPlayCatalogEpisode[];
  translateEpisode: (num: number) => string;
}): MergedSeason[] {
  const seasonsMap = new Map<number, MergedSeason>();

  for (const season of localSeasons) {
    seasonsMap.set(season.number, {
      id: season.id,
      number: season.number,
      episodes: [...season.episodes]
        .sort((a, b) => a.number - b.number)
        .map((episode) => ({
          id: episode.id,
          number: episode.number,
          title: episode.title,
          href: episode.publicId
            ? `/watch/${episode.publicId}/${episode.slug || "episode-" + episode.number}`
            : `/watch/${episode.id}/${episode.slug || "episode-" + episode.number}`,
          videoUrl: episode.videoUrl,
          imageUrl: episode.imageUrl,
          publicId: episode.publicId,
          slug: episode.slug,
        })),
    });
  }

  const externalOnlyEpisodes = externalEpisodes.sort(
    (a, b) => a.number - b.number,
  );

  const targetSeasonNumber =
    localSeasons.length > 0
      ? Math.max(...localSeasons.map((season) => season.number))
      : 1;

  if (!seasonsMap.has(targetSeasonNumber)) {
    seasonsMap.set(targetSeasonNumber, {
      id: `megaplay-season-${targetSeasonNumber}`,
      number: targetSeasonNumber,
      episodes: [],
    });
  }

  const targetSeason = seasonsMap.get(targetSeasonNumber)!;
  const currentMaxEpisodeNumber =
    targetSeason.episodes.reduce(
      (max, episode) => Math.max(max, episode.number),
      0,
    ) || 0;

  for (const episode of externalOnlyEpisodes) {
    if (episode.number <= currentMaxEpisodeNumber) {
      continue;
    }
    targetSeason.episodes.push({
      id: `megaplay-${episode.number}`,
      number: episode.number,
      title:
        episode.title || `${animeTitle} - ${translateEpisode(episode.number)}`,
      href: `/watch/${animeSlug}/episode-${episode.number}?source=megaplay&episode=${episode.number}`,
      videoUrl: `/watch/${animeSlug}/episode-${episode.number}?source=megaplay&episode=${episode.number}`,
      imageUrl: null,
      publicId: null,
      slug: `episode-${episode.number}`,
    });
  }

  return Array.from(seasonsMap.values())
    .map((season) => ({
      ...season,
      episodes: season.episodes.sort((a, b) => a.number - b.number),
    }))
    .filter((season) => season.episodes.length > 0)
    .sort((a, b) => a.number - b.number);
}

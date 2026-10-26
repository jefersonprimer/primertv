"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ListVideo, ArrowRight, ChevronLeft } from "lucide-react";
import RatingBadge from "@/components/RatingBadge";
import { useTranslations } from "next-intl";
import type { FranchiseItem } from "@/lib/anime-relations";
import SeasonDropdown from "@/components/SeasonDropdown";
import { getAnimeSeasonEpisodesAction } from "@/app/actions/getAnimeQuickPreview";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  publicId: string | null;
  slug: string | null;
  href?: string | null;
}

interface Season {
  id: string;
  number: number;
  title?: string | null;
  episodes: Episode[];
}

interface EpisodeSidebarProps {
  seasons: Season[];
  currentEpisodeId: string;
  animeSlug: string;
  animeRating: string | null;
  animeDuration: string | null;
  fallbackImageUrl?: string | null;
  isMegaplay?: boolean;
  isDubbed?: boolean;
  isSubtitled?: boolean;
  sequel?: FranchiseItem | null;
  prequel?: FranchiseItem | null;
}

function formatDuration(duration: string | null | undefined): string {
  if (!duration || duration.toLowerCase() === "unknown") return "";
  const matches = duration.match(/\d+/);
  if (matches) {
    return `${matches[0]}m`;
  }
  return "";
}

export default function EpisodeSidebar({
  seasons,
  currentEpisodeId,
  animeSlug,
  animeRating,
  animeDuration,
  fallbackImageUrl,
  isMegaplay = false,
  isDubbed = false,
  isSubtitled = false,
  sequel,
  prequel,
}: EpisodeSidebarProps) {
  const t = useTranslations("EpisodeSidebar");
  const tLabels = useTranslations("Labels");
  const tMedia = useTranslations("MediaCard");
  const tSelector = useTranslations("SeasonSelector");
  // Find current episode and flatten list of episodes across all seasons
  const [seasonData, setSeasonData] = useState(seasons);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [loadedSeasons, setLoadedSeasons] = useState<Set<number>>(() => {
    const current = seasons.find((season) =>
      season.episodes.some((episode) => episode.id === currentEpisodeId),
    );
    return new Set(current ? [current.number] : []);
  });
  const allEpisodes = seasonData.flatMap((s) =>
    s.episodes.map((ep) => ({
      ...ep,
      seasonNumber: s.number,
      seasonId: s.id,
    })),
  );

  const currentEp = allEpisodes.find((ep) => ep.id === currentEpisodeId);
  const currentIndex = allEpisodes.findIndex(
    (ep) => ep.id === currentEpisodeId,
  );
  const isFirstEpisode = currentIndex === 0;

  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < allEpisodes.length - 1
      ? allEpisodes[currentIndex + 1]
      : null;

  // State
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState(
    currentEp?.seasonId || seasons[0]?.id,
  );
  const [visibleCount, setVisibleCount] = useState(12);

  const selectedSeason = seasonData.find((s) => s.id === selectedSeasonId);
  const episodesOfSelectedSeason = selectedSeason?.episodes || [];

  const selectSeason = async (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setVisibleCount(12);
    const season = seasonData.find((item) => item.id === seasonId);
    if (!season || loadedSeasons.has(season.number)) return;

    setLoadingSeason(true);
    try {
      const episodes = await getAnimeSeasonEpisodesAction(
        animeSlug,
        season.number,
      );
      setSeasonData((current) =>
        current.map((item) =>
          item.id === seasonId
            ? {
                ...item,
                episodes: episodes.map((episode) => ({
                  ...episode,
                  videoUrl: null,
                })),
              }
            : item,
        ),
      );
      setLoadedSeasons((current) => new Set(current).add(season.number));
    } finally {
      setLoadingSeason(false);
    }
  };

  const handleToggleShowAll = () => {
    setShowAllEpisodes(!showAllEpisodes);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Next & Prev Cards (hidden if showAllEpisodes is true) */}
      {!showAllEpisodes && (
        <div className="flex flex-col gap-4">
          {/* If there is a next episode in current anime */}
          {nextEpisode && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider md:px-2">
                {isFirstEpisode ? t("next") : t("nextEp")}
              </h3>
              <EpisodeCard
                ep={nextEpisode}
                animeSlug={animeSlug}
                animeRating={animeRating}
                animeDuration={animeDuration}
                fallbackImageUrl={fallbackImageUrl}
                isMegaplay={isMegaplay}
                isDubbed={isDubbed}
                isSubtitled={isSubtitled}
                seasonNumber={nextEpisode.seasonNumber}
              />
            </div>
          )}

          {/* When at the end of the anime, show Sequel (Próxima Temporada) */}
          {!nextEpisode && sequel && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 md:px-2">
                <h4 className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                  {t("nextSeasonBadge")}
                </h4>
              </div>
              <Link
                href={sequel.firstEpisodeHref}
                className="group relative flex items-center gap-3 p-2 transition-all rounded-xl hover:bg-[#2A2A2A]"
              >
                <div className="relative aspect-video w-38 shrink-0 overflow-hidden rounded-md">
                  {sequel.imageUrl || sequel.bannerUrl ? (
                    <Image
                      src={sequel.imageUrl || sequel.bannerUrl || ""}
                      alt={sequel.title}
                      fill
                      sizes="128px"
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
                      {tLabels("noImage")}
                    </div>
                  )}
                  {sequel.rating && (
                    <div className="absolute top-1 left-1 z-10 scale-90 origin-top-left">
                      <RatingBadge rating={sequel.rating} size={16} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-end p-1">
                    {formatDuration(sequel.duration) && (
                      <span className="rounded bg-[#0009] px-1 py-0.5 text-sm font-semibold text-white backdrop-blur-sm">
                        {formatDuration(sequel.duration)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white line-clamp-3">
                    {sequel.title}
                  </h4>
                  {(sequel.isDubbed || sequel.isSubtitled) && (
                    <span className="mt-1 text-sm font-normal text-[#8c8c8c]">
                      {sequel.isDubbed && sequel.isSubtitled
                        ? tMedia("subDub")
                        : sequel.isDubbed
                          ? tMedia("dubbed")
                          : tMedia("subtitled")}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* Previous episode card */}
          {prevEpisode && (
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider md:px-2">
                {t("prevEp")}
              </h3>
              <EpisodeCard
                ep={prevEpisode}
                animeSlug={animeSlug}
                animeRating={animeRating}
                animeDuration={animeDuration}
                fallbackImageUrl={fallbackImageUrl}
                isMegaplay={isMegaplay}
                isDubbed={isDubbed}
                isSubtitled={isSubtitled}
                seasonNumber={prevEpisode.seasonNumber}
              />
            </div>
          )}

          {/* When on the first episode, show Prequel link if available */}
          {isFirstEpisode && prequel && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 md:px-2">
                <h4 className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                  {t("prevSeasonBadge")}
                </h4>
              </div>
              <Link
                href={prequel.firstEpisodeHref}
                className="group relative flex items-center gap-3 p-2 transition-all rounded-xl hover:bg-[#2A2A2A]"
              >
                <div className="relative aspect-video w-38 shrink-0 overflow-hidden rounded-md bg-zinc-800">
                  {prequel.imageUrl || prequel.bannerUrl ? (
                    <Image
                      src={prequel.imageUrl || prequel.bannerUrl || ""}
                      alt={prequel.title}
                      fill
                      sizes="128px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-md"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
                      {tLabels("noImage")}
                    </div>
                  )}
                  {prequel.rating && (
                    <div className="absolute top-1 left-1 z-10 scale-90 origin-top-left">
                      <RatingBadge rating={prequel.rating} size={16} />
                    </div>
                  )}
                  {formatDuration(prequel.duration) && (
                    <div className="absolute bottom-1 right-1 rounded bg-[#0009] px-1 py-0.5 text-sm font-semibold text-white backdrop-blur-sm">
                      {formatDuration(prequel.duration)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-zinc-400 line-clamp-1">
                    {prequel.title}
                  </span>
                  {(prequel.isDubbed || prequel.isSubtitled) && (
                    <span className="text-sm font-normal text-[#8c8c8c]">
                      {prequel.isDubbed && prequel.isSubtitled
                        ? tMedia("subDub")
                        : prequel.isDubbed
                          ? tMedia("dubbed")
                          : tMedia("subtitled")}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" />
                    <span>{t("goToPrequel")}</span>
                  </h4>
                </div>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. "Ver mais episódios" Button */}
      <button
        onClick={handleToggleShowAll}
        className="flex items-center rounded-md gap-2 w-full md:w-fit px-2.5 py-1.5 md:mx-2 text-sm font-bold text-[#bbb] hover:text-white transition-all active:scale-95 justify-center text-center uppercase tracking-wide border-2 border-[#bbb] hover:border-white"
      >
        <ListVideo size={24} />
        {showAllEpisodes ? t("backToSummary") : t("seeMoreEpisodes")}
      </button>

      {/* 3. Season Selector & Episode List (shown if showAllEpisodes is true) */}
      {showAllEpisodes && (
        <div className="flex flex-col gap-4 ">
          {/* Season Dropdown */}
          <SeasonDropdown
            options={seasonData.map((season) => ({
              value: season.id,
              label:
                season.title || tSelector("season", { number: season.number }),
              detail:
                season.episodes.length > 0
                  ? tSelector("episodesCount", {
                      count: season.episodes.length,
                    })
                  : undefined,
            }))}
            value={selectedSeasonId || seasons[0]?.id || ""}
            onChange={(value) => void selectSeason(String(value))}
            ariaLabel={tSelector("season", {
              number: selectedSeason?.number || 1,
            })}
            className="w-full max-w-[378px] px-2"
          />

          {/* Episode List */}
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1 py-2">
            {loadingSeason && (
              <div className="flex flex-col gap-2" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 sm:p-2 animate-pulse"
                  >
                    <div className="aspect-video w-38 shrink-0 rounded-md bg-zinc-800" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="h-4 w-3/4 rounded bg-zinc-800" />
                      <div className="h-3 w-1/2 rounded bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col">
              {!loadingSeason &&
                episodesOfSelectedSeason.slice(0, visibleCount).map((ep) => {
                  const isCurrent = ep.id === currentEpisodeId;
                  return (
                    <EpisodeCard
                      key={ep.id}
                      ep={ep}
                      animeSlug={animeSlug}
                      animeRating={animeRating}
                      animeDuration={animeDuration}
                      fallbackImageUrl={fallbackImageUrl}
                      isCurrent={isCurrent}
                      isMegaplay={isMegaplay}
                      isDubbed={isDubbed}
                      isSubtitled={isSubtitled}
                      seasonNumber={selectedSeason?.number}
                    />
                  );
                })}
            </div>

            {episodesOfSelectedSeason.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="w-full rounded-md mt-2 py-3 px-4  bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-50 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-center uppercase tracking-wide"
              >
                {tLabels("showMore")}
              </button>
            )}

            {sequel && (
              <div className="mt-3 p-3 rounded-md bg-zinc-800 flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    {t("nextSeasonBadge")}
                  </span>
                  <span className="text-xs font-bold text-white line-clamp-1">
                    {sequel.title}
                  </span>
                </div>
                <Link
                  href={sequel.firstEpisodeHref}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shrink-0 flex items-center gap-1"
                >
                  <span>EP {sequel.firstEpisodeNumber || 1}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface EpisodeCardProps {
  ep: Episode;
  animeSlug: string;
  animeRating: string | null;
  animeDuration: string | null;
  fallbackImageUrl?: string | null;
  isCurrent?: boolean;
  isMegaplay?: boolean;
  isDubbed?: boolean;
  isSubtitled?: boolean;
  seasonNumber?: number;
}

function EpisodeCard({
  ep,
  animeSlug,
  animeRating,
  animeDuration,
  fallbackImageUrl,
  isCurrent = false,
  isMegaplay = false,
  isDubbed = false,
  isSubtitled = false,
  seasonNumber,
}: EpisodeCardProps) {
  const tLabels = useTranslations("Labels");
  const tMedia = useTranslations("MediaCard");
  const watchHref =
    !ep.publicId && ep.href
      ? ep.href
      : isMegaplay
        ? `/watch/${animeSlug}/episode-${ep.number}?source=megaplay&episode=${ep.number}${seasonNumber ? `&season=${seasonNumber}` : ""}`
        : ep.publicId
          ? `/watch/${ep.publicId}/${ep.slug || "episode-" + ep.number}`
          : `/watch/${ep.id}/${ep.slug || "episode-" + ep.number}`;

  return (
    <Link
      href={watchHref}
      className={`flex items-center gap-3 p-2 transition-colors rounded-xl ${
        isCurrent
          ? "border-blue-500 bg-[#2A2A2A]"
          : "border-zinc-200 hover:bg-[#2A2A2A]"
      }`}
    >
      {/* Left: Image Container */}
      <div className="relative aspect-video w-38 shrink-0 overflow-hidden bg-zinc-100 rounded-md">
        {ep.imageUrl || fallbackImageUrl ? (
          <Image
            src={ep.imageUrl || fallbackImageUrl || ""}
            alt={ep.title || `${tLabels("episode")} ${ep.number}`}
            fill
            sizes="128px"
            className="object-cover rounded-md"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
            {tLabels("noImage")}
          </div>
        )}
        {/* RatingBadge top-left */}
        {animeRating && (
          <div className="absolute top-1 left-1 z-10 scale-90 origin-top-left">
            <RatingBadge rating={animeRating} size={16} />
          </div>
        )}
        {/* Duration bottom-right */}
        {formatDuration(animeDuration) && (
          <div className="absolute rounded bottom-1 right-1 bg-[#0009] px-1 py-0.5 text-sm font-semibold text-white backdrop-blur-sm">
            {formatDuration(animeDuration)}
          </div>
        )}
      </div>

      {/* Right: Info */}
      <div className="flex flex-col min-w-0">
        <h3 className="text-sm font-bold text-white line-clamp-3">
          E{ep.number} - {ep.title || `${tLabels("episode")} ${ep.number}`}
        </h3>
        {(isDubbed || isSubtitled) && (
          <div className="flex gap-1.5 items-center mt-1">
            {isDubbed && isSubtitled ? (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {tMedia("subDub")}
              </span>
            ) : isDubbed ? (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {tMedia("dubbed")}
              </span>
            ) : (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {tMedia("subtitled")}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

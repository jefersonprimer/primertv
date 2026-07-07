"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ListVideo } from "lucide-react";
import RatingBadge from "@/components/RatingBadge";
import { useTranslations } from "next-intl";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  publicId: string | null;
  slug: string | null;
}

interface Season {
  id: string;
  number: number;
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
}

function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "";
  const matches = duration.match(/\d+/);
  if (matches) {
    return `${matches[0]}m`;
  }
  return duration;
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
}: EpisodeSidebarProps) {
  const t = useTranslations("EpisodeSidebar");
  const tLabels = useTranslations("Labels");
  const tSelector = useTranslations("SeasonSelector");
  // Find current episode and flatten list of episodes across all seasons
  const allEpisodes = seasons.flatMap((s) =>
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
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const seasonRef = useRef<HTMLDivElement>(null);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        seasonRef.current &&
        !seasonRef.current.contains(event.target as Node)
      ) {
        setSeasonDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);
  const episodesOfSelectedSeason = selectedSeason?.episodes || [];

  const handleToggleShowAll = () => {
    setShowAllEpisodes(!showAllEpisodes);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Next & Prev Cards (hidden if showAllEpisodes is true) */}
      {!showAllEpisodes && (
        <div className="flex flex-col gap-4">
          {/* If on first episode */}
          {isFirstEpisode ? (
            <>
              {nextEpisode && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider md:px-2">
                    {t("next")}
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
                  />
                </div>
              )}
            </>
          ) : (
            /* From second episode onwards */
            <>
              {nextEpisode && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider md:px-2">
                    {t("nextEp")}
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
                  />
                </div>
              )}
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
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 2. "Ver mais episódios" Button */}
      <button
        onClick={handleToggleShowAll}
        className="flex items-center gap-2 w-full md:fit px-2.5 py-1.5 md:mx-2 text-sm font-bold text-[#bbb] hover:text-white transition-all hover:bg-[#272727] active:scale-95 justify-center text-center uppercase tracking-wide border-2 border-[#bbb] hover:border-white"
      >
        <ListVideo size={24} />
        {showAllEpisodes ? t("backToSummary") : t("seeMoreEpisodes")}
      </button>

      {/* 3. Season Selector & Episode List (shown if showAllEpisodes is true) */}
      {showAllEpisodes && (
        <div className="flex flex-col gap-4 shadow-sm">
          {/* Season Dropdown */}
          <div className="relative w-full max-w-[378px]" ref={seasonRef}>
            <button
              onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
              className="flex w-full items-center gap-2 px-2 text-lg font-bold text-white hover:text-blue-500 transition-colors"
            >
              <span>
                {tSelector("season", {
                  number: selectedSeason ? selectedSeason.number : 1,
                })}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  seasonDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {seasonDropdownOpen && (
              <div className="absolute left-2 right-0 z-50 mt-1 py-2 max-h-60 overflow-y-auto bg-[#272727]">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setSelectedSeasonId(season.id);
                      setSeasonDropdownOpen(false);
                      setVisibleCount(12);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#151515] flex items-center justify-between ${
                      season.id === selectedSeasonId
                        ? "text-white bg-[#151515]"
                        : "text-[#bbb] hover:text-white"
                    }`}
                  >
                    <span>
                      {tSelector("season", { number: season.number })}
                    </span>
                    <span className="text-xs text-[#bbb] font-normal">
                      {tSelector("episodesCount", {
                        count: season.episodes.length,
                      })}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Episode List */}
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 py-2">
            <div className="flex flex-col">
              {episodesOfSelectedSeason.slice(0, visibleCount).map((ep) => {
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
                  />
                );
              })}
            </div>

            {episodesOfSelectedSeason.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="w-full mt-2 py-2 px-4  bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-50 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-center uppercase tracking-wide border border-zinc-200 dark:border-zinc-700"
              >
                {tLabels("showMore")}
              </button>
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
}: EpisodeCardProps) {
  const tLabels = useTranslations("Labels");
  const tMedia = useTranslations("MediaCard");
  const watchHref = isMegaplay
    ? `/watch/${animeSlug}/episode-${ep.number}?source=megaplay&episode=${ep.number}`
    : ep.publicId
      ? `/watch/${ep.publicId}/${ep.slug || "episode-" + ep.number}`
      : `/watch/${ep.id}/${ep.slug || "episode-" + ep.number}`;

  return (
    <Link
      href={watchHref}
      className={`flex items-center gap-3 sm:p-2 transition-colors ${
        isCurrent
          ? "border-blue-500 bg-[#151515] dark:border-blue-500"
          : "border-zinc-200 dark:border-zinc-800 hover:bg-[#151515]"
      }`}
    >
      {/* Left: Image Container */}
      <div className="relative aspect-video w-38 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {ep.imageUrl || fallbackImageUrl ? (
          <Image
            src={ep.imageUrl || fallbackImageUrl || ""}
            alt={ep.title || `${tLabels("episode")} ${ep.number}`}
            fill
            sizes="128px"
            className="object-cover"
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
        {animeDuration && (
          <div className="absolute bottom-1 right-1 bg-[#0009] px-1 py-0.5 text-sm font-bold text-white backdrop-blur-sm">
            {formatDuration(animeDuration)}
          </div>
        )}
      </div>

      {/* Right: Info */}
      <div className="flex flex-col min-w-0">
        <h3 className="text-sm font-bold text-white truncate leading-snug">
          EP {ep.number} - {ep.title || `${tLabels("episode")} ${ep.number}`}
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

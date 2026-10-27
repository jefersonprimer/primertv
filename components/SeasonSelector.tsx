"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  SortDesc as ListSortDescending,
} from "lucide-react";
import EpisodeList from "./EpisodeList";
import SeasonDropdown from "./SeasonDropdown";
import { getAnimeSeasonEpisodesAction } from "@/app/actions/getAnimeQuickPreview";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  publicId?: string | null;
  slug?: string | null;
  href?: string | null;
  createdAt?: string | Date | null;
}

interface Season {
  id: string;
  number: number;
  title?: string | null;
  episodes: Episode[];
}

interface SeasonSelectorProps {
  seasons: Season[];
  animeSlug: string;
  animeTitle?: string | null;
  animeRating?: string | null;
  animeDuration?: string | null;
  baseUrl?: string;
  fallbackImageUrl?: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
}

export default function SeasonSelector({
  seasons,
  animeSlug,
  animeTitle,
  animeRating,
  animeDuration,
  baseUrl,
  fallbackImageUrl,
  isDubbed = false,
  isSubtitled = false,
}: SeasonSelectorProps) {
  const t = useTranslations("SeasonSelector");
  const locale = useLocale();
  const [seasonData, setSeasonData] = useState(seasons);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [loadedSeasons, setLoadedSeasons] = useState<Set<number>>(
    () => new Set(seasons.length > 0 ? [seasons[0].number] : []),
  );
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"oldest" | "newest">("oldest");

  const currentSeason = seasonData[currentIndex];

  if (!currentSeason) return null;

  const selectSeason = async (index: number) => {
    const season = seasonData[index];
    if (!season) return;
    setCurrentIndex(index);
    if (loadedSeasons.has(season.number)) return;

    setLoadingSeason(true);
    try {
      const episodes = await getAnimeSeasonEpisodesAction(
        animeSlug,
        season.number,
      );
      setSeasonData((current) =>
        current.map((item) =>
          item.number === season.number
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

  const sortedEpisodes = [...currentSeason.episodes]
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return a.number - b.number;
      } else {
        return b.number - a.number;
      }
    })
    .map((ep) => ({
      ...ep,
      href:
        ep.href ||
        (ep.publicId
          ? `/watch/${ep.publicId}/${ep.slug || "episode-" + ep.number}`
          : baseUrl
            ? `${baseUrl}/${ep.id}`
            : `/watch/${ep.id}/${ep.slug || "episode-" + ep.number}`),
    }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SeasonDropdown
            options={seasonData.map((season) => ({
              value: season.id,
              label: season.title || t("season", { number: season.number }),
              detail:
                season.episodes.length > 0
                  ? t("episodesCount", { count: season.episodes.length })
                  : undefined,
            }))}
            value={currentSeason.id}
            onChange={(value) => {
              const nextIndex = seasonData.findIndex(
                (season) => season.id === value,
              );
              if (nextIndex >= 0) void selectSeason(nextIndex);
            }}
            ariaLabel={t("seasonsTitle")}
            className="inline-block"
          />
        </div>

        <div className="relative inline-block shrink-0">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className={`flex items-center rounded-md p-2 gap-2 text-sm font-bold transition-colors cursor-pointer uppercase ${
              isSortOpen
                ? "bg-[#272727] text-[#f2f2f2]"
                : "hover:bg-[#151515] text-[#bbb] hover:text-[#f2f2f2]"
            }`}
            title={sortBy === "oldest" ? t("oldest") : t("newest")}
            aria-label={sortBy === "oldest" ? t("oldest") : t("newest")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 12H3" />
              <path d="M3 5h18" />
              <path d="M9 19H3" />
            </svg>
            <span className="hidden sm:inline">
              {sortBy === "oldest" ? t("oldest") : t("newest")}
            </span>
          </button>

          {isSortOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSortOpen(false)}
              />
              <div className="absolute mt-1 right-0 top-full rounded-xl z-50 w-48 overflow-hidden bg-[#272727] p-2 shadow-xl">
                <button
                  onClick={() => {
                    setSortBy("oldest");
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-4 py-2 rounded-md text-left text-sm font-semibold transition-colors flex items-center gap-2 uppercase cursor-pointer ${
                    sortBy === "oldest"
                      ? "bg-[#151515] text-[#f2f2f2]"
                      : "bg-[#272727] text-[#bbb] hover:bg-[#151515] hover:text-[#f2f2f2]"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 12H3" />
                    <path d="M3 5h18" />
                    <path d="M9 19H3" />
                  </svg>
                  <span>{t("sortByOldest")}</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-4 py-2 rounded-md text-left text-sm font-semibold transition-colors flex items-center gap-2 uppercase cursor-pointer ${
                    sortBy === "newest"
                      ? "bg-[#151515] text-[#f2f2f2]"
                      : "bg-[#272727] text-[#bbb] hover:bg-[#151515] hover:text-[#f2f2f2]"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 12H3" />
                    <path d="M3 5h18" />
                    <path d="M9 19H3" />
                  </svg>
                  <span>{t("sortByNewest")}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <EpisodeList
        key={`${currentSeason.id}-${sortBy}`}
        items={sortedEpisodes}
        isLoading={loadingSeason}
        baseUrl={baseUrl || `/animes/${animeSlug}/episode`}
        itemType="episode"
        animeTitle={animeTitle}
        animeRating={animeRating}
        animeDuration={animeDuration}
        fallbackImageUrl={fallbackImageUrl}
        isDubbed={isDubbed}
        isSubtitled={isSubtitled}
        preserveOrder
      />

      {seasons.length > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 pt-6 mt-2">
          <button
            onClick={() =>
              currentIndex > 0 && void selectSeason(currentIndex - 1)
            }
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="flex items-center gap-1">
              {locale === "en" ? (
                <>
                  {t("prev")}
                  <span className="hidden sm:flex"> {t("seasonLabel")}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:flex">{t("seasonLabel")} </span>
                  {t("prev")}
                </>
              )}
            </span>
          </button>

          <button
            onClick={() =>
              currentIndex < seasonData.length - 1 &&
              void selectSeason(currentIndex + 1)
            }
            disabled={currentIndex === seasonData.length - 1}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase"
          >
            <span className="flex items-center gap-1">
              {t("next")}
              <span className="hidden sm:flex"> {t("seasonLabel")}</span>
            </span>

            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

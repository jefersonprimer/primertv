"use client";

import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  SortDesc as ListSortDescending,
} from "lucide-react";
import EpisodeList from "./EpisodeList";

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
  const tButtons = useTranslations("Buttons");
  const locale = useLocale();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"oldest" | "newest">("oldest");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const shouldLockScroll = window.matchMedia("(max-width: 767px)").matches;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (shouldLockScroll) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      if (shouldLockScroll) document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentSeason = seasons[currentIndex];

  if (!currentSeason) return null;

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
        <div className="relative inline-block min-w-0 flex-1">
          <button
            onClick={() => seasons.length > 1 && setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            className={`flex items-center gap-2 text-lg font-bold text-[#f2f2f2] text-left max-w-full ${
              seasons.length > 1
                ? "cursor-pointer hover:text-[#0077FD] transition-colors"
                : ""
            }`}
            title={
              currentSeason.title
                ? currentSeason.title
                : t("season", { number: currentSeason.number })
            }
          >
            <span className="line-clamp-1">
              {currentSeason.title
                ? currentSeason.title
                : t("season", { number: currentSeason.number })}
            </span>
            {seasons.length > 1 && (
              <ChevronDown
                className={`h-6 w-6 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            )}
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40 hidden md:block"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-2 hidden w-max max-w-[min(90vw,50rem)] overflow-hidden rounded-xl bg-[#272727] p-2 shadow-xl md:block">
                {seasons.map((season, index) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsOpen(false);
                    }}
                    className={`w-full gap-8 px-4 py-3 rounded-md text-left text-sm font-medium transition-colors hover:bg-[#151515] flex items-center justify-between ${
                      index === currentIndex
                        ? "bg-[#151515] text-white"
                        : "text-[#bbb]"
                    }`}
                  >
                    <span
                      className="min-w-0 max-w-[460px] truncate"
                      title={
                        season.title
                          ? season.title
                          : t("season", { number: season.number })
                      }
                    >
                      {season.title
                        ? season.title
                        : t("season", { number: season.number })}
                    </span>
                    <span className="text-xs text-[#bbb] font-normal">
                      {t("episodesCount", { count: season.episodes.length })}
                    </span>
                  </button>
                ))}
              </div>
              <div
                className="fixed inset-0 z-[100] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#151515] p-4 md:hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="season-picker-title"
              >
                <div className="mb-4 flex shrink-0 items-center justify-between border-b border-zinc-800 pb-4">
                  <h2
                    id="season-picker-title"
                    className="text-xl font-bold text-zinc-100"
                  >
                    {t("seasonsTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label={tButtons("close")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {seasons.map((season, index) => (
                    <button
                      key={season.id}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsOpen(false);
                      }}
                      className={`mb-1 flex w-full items-center justify-between gap-4 rounded-lg px-4 py-4 text-left text-base font-medium transition-colors hover:bg-zinc-800 ${
                        index === currentIndex
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300"
                      }`}
                    >
                      <span
                        className="min-w-0 flex-1 truncate"
                        title={
                          season.title || t("season", { number: season.number })
                        }
                      >
                        {season.title || t("season", { number: season.number })}
                      </span>
                      <span className="shrink-0 text-sm text-zinc-400">
                        {t("episodesCount", {
                          count: season.episodes.length,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
            <ListSortDescending className="h-6 w-6 shrink-0" />
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
                  <ListSortDescending className="h-5 w-5 shrink-0" />
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
                  <ListSortDescending className="h-5 w-5 shrink-0" />
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
              currentIndex > 0 && setCurrentIndex(currentIndex - 1)
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
              currentIndex < seasons.length - 1 &&
              setCurrentIndex(currentIndex + 1)
            }
            disabled={currentIndex === seasons.length - 1}
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

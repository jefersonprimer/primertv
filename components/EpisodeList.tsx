"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import { PlayIcon, BookOpen, ChevronDown } from "lucide-react";
import RatingBadge from "./RatingBadge";
import Link from "next/link";

interface Item {
  id: string;
  number: number;
  title: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  animeTitle?: string | null;
  animeRating?: string | null;
  animeDuration?: string | null;
  href?: string;
}

interface EpisodeListProps {
  items?: Item[];
  isLoading?: boolean;
  baseUrl?: string;
  label?: string; // "Episódio" or "Capítulo"
  itemType: "episode" | "chapter";
  animeTitle?: string | null;
  animeRating?: string | null;
  animeDuration?: string | null;
  fallbackImageUrl?: string | null;
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

function formatItemNumber(num: number): string {
  // Round to 4 decimal places to fix floating point precision issues (e.g. 0.00999999977648258 -> 0.01)
  const rounded = Number(num.toFixed(4));

  if (Number.isInteger(rounded)) {
    if (rounded >= 0 && rounded < 10) {
      return rounded.toString().padStart(2, "0");
    }
    return rounded.toString();
  }

  // For decimal numbers, e.g. 0.01 or 1.5
  const parts = rounded.toString().split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parts[1];

  const formattedInteger =
    integerPart >= 0 && integerPart < 10
      ? integerPart.toString().padStart(2, "0")
      : parts[0];

  return `${formattedInteger}.${decimalPart}`;
}

function isGenericTitle(
  title: string | null | undefined,
  num: number,
): boolean {
  if (!title) return true;
  const cleanTitle = title.trim().toLowerCase();
  if (!cleanTitle) return true;

  const roundedNum = Number(num.toFixed(4));
  const rawNumStr = num.toString();
  const formattedNum = formatItemNumber(num);

  // If the title is just the number itself
  if (cleanTitle === rawNumStr || cleanTitle === formattedNum) {
    return true;
  }

  // Words to check/remove
  const wordsToRemove = [
    "chapter",
    "capítulo",
    "capitulo",
    "ch",
    "cap",
    "episode",
    "episódio",
    "episodio",
    "ep",
  ];
  let stripped = cleanTitle;
  for (const word of wordsToRemove) {
    if (stripped.startsWith(word)) {
      stripped = stripped.substring(word.length).trim();
    }
  }

  // Strip leading and trailing symbols (dots, colons, hyphens, spaces)
  stripped = stripped
    .replace(/^[.:\-\s]+/, "")
    .replace(/[.:\-\s]+$/, "")
    .trim();

  // If nothing is left, or if the remaining part parses to the same chapter number
  if (stripped === "") return true;

  const parsedStripped = Number(stripped);
  if (!isNaN(parsedStripped)) {
    const roundedParsed = Number(parsedStripped.toFixed(4));
    if (roundedParsed === roundedNum) {
      return true;
    }
  }

  return false;
}

export default function EpisodeList({
  items = [],
  isLoading = false,
  baseUrl,
  label = "Episódio",
  itemType,
  animeTitle,
  animeRating,
  animeDuration,
  fallbackImageUrl,
  isDubbed = false,
  isSubtitled = false,
}: EpisodeListProps) {
  const t = useTranslations("Labels");
  const tSort = useTranslations("SeasonSelector");
  const tMedia = useTranslations("MediaCard");
  const [visibleCount, setVisibleCount] = useState(
    itemType === "chapter" ? 24 : 12,
  );
  const [sortBy, setSortBy] = useState<"oldest" | "newest">("oldest");
  const [isSortOpen, setIsSortOpen] = useState(false);

  const getTranslatedLabel = (l: string) => {
    switch (l.toLowerCase()) {
      case "capítulo":
      case "chapter":
        return t("chapter");
      case "filme":
      case "movie":
        return t("movie");
      case "episódio":
      case "episode":
      default:
        return t("episode");
    }
  };
  const displayLabel = getTranslatedLabel(label);

  const showMore = () => {
    setVisibleCount((prev) => prev + (itemType === "chapter" ? 24 : 12));
  };

  if (isLoading) {
    return <EpisodeListSkeleton itemType={itemType} count={visibleCount} />;
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "oldest") {
      return a.number - b.number;
    } else {
      return b.number - a.number;
    }
  });

  const visibleItems = sortedItems.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  return (
    <div className="flex flex-col gap-8">
      {itemType === "chapter" && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-50">
              {t("chapters")}
            </h2>
            <span className="inline-flex items-center justify-center p-2 text-xs font-semibold rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/40 shadow-sm">
              {items.length}
            </span>
          </div>
          <div className="relative inline-block">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`flex items-center p-2 gap-2 text-sm font-bold transition-colors cursor-pointer uppercase  ${
                isSortOpen
                  ? "bg-[#272727] text-[#f2f2f2]"
                  : "hover:bg-[#151515] text-[#bbb] hover:text-[#f2f2f2]"
              }`}
            >
              <span>
                {sortBy === "oldest" ? tSort("oldest") : tSort("newest")}
              </span>
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${isSortOpen ? "rotate-180 text-[#f2f2f2]" : "text-[#bbb]"}`}
              />
            </button>

            {isSortOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSortOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 w-40 overflow-hidden bg-[#272727] py-2 shadow-xl">
                  <button
                    onClick={() => {
                      setSortBy("oldest");
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors flex items-center justify-between uppercase cursor-pointer ${
                      sortBy === "oldest"
                        ? "bg-[#151515] text-[#f2f2f2]"
                        : "bg-[#272727] text-[#bbb] hover:bg-[#151515] hover:text-[#f2f2f2]"
                    }`}
                  >
                    <span>{tSort("sortByOldest")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("newest");
                      setIsSortOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm font-semibold transition-colors flex items-center justify-between uppercase cursor-pointer ${
                      sortBy === "newest"
                        ? "bg-[#151515] text-[#f2f2f2]"
                        : "bg-[#272727] text-[#bbb] hover:bg-[#151515] hover:text-[#f2f2f2]"
                    }`}
                  >
                    <span>{tSort("sortByNewest")}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item) => {
          const displayAnimeTitle = item.animeTitle || animeTitle;
          const displayAnimeRating = item.animeRating || animeRating;
          const displayAnimeDuration = item.animeDuration || animeDuration;
          const formattedNum = formatItemNumber(item.number);

          return (
            <Link
              key={item.id}
              href={item.href || (baseUrl ? `${baseUrl}/${item.id}` : "#")}
              className={
                itemType === "episode"
                  ? "group relative flex gap-3 p-2 md:p-0 hover:bg-[#151515] transition-all duration-300 overflow-hidden flex-row sm:flex-col"
                  : "group relative flex items-center justify-between p-4 bg-zinc-900/10 hover:bg-zinc-900/40 border border-zinc-800/80 hover:border-blue-500/50 transition-all duration-300 rounded-md"
              }
            >
              {itemType === "episode" && (
                <div className="relative aspect-video w-38 sm:w-full flex-shrink-0 overflow-hidden bg-zinc-800">
                  {item.imageUrl || fallbackImageUrl ? (
                    <Image
                      src={item.imageUrl || fallbackImageUrl || ""}
                      alt={item.title || `${displayLabel} ${formattedNum}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-xs text-zinc-500">
                      {t("noImage")}
                    </div>
                  )}

                  {/* Rating badge on top-left */}
                  {displayAnimeRating && (
                    <div className="absolute top-1 left-1 z-10">
                      <RatingBadge rating={displayAnimeRating} size={16} />
                    </div>
                  )}

                  {/* Duration badge on bottom-right */}
                  {displayAnimeDuration && (
                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 text-sm font-bold text-white backdrop-blur-sm">
                      {formatDuration(displayAnimeDuration)}
                    </div>
                  )}
                </div>
              )}

              {/* Text under the image / info */}
              {itemType === "episode" ? (
                <div className="flex flex-col gap-1 flex-1 justify-center sm:justify-start">
                  {displayAnimeTitle && (
                    <span className="text-[10px] font-normal sm:font-bold text-[#8c8c8c] uppercase tracking-wider line-clamp-1">
                      {displayAnimeTitle}
                    </span>
                  )}
                  <h3 className="line-clamp-2 text-base font-bold text-white">
                    {item.title &&
                    item.title.trim() &&
                    !isGenericTitle(item.title, item.number)
                      ? item.title
                      : `${displayLabel} ${formattedNum}`}
                  </h3>
                  {(isDubbed || isSubtitled) && (
                    <div className="flex gap-1.5 items-center mt-2">
                      {isDubbed && isSubtitled ? (
                        <span className="text-sm text-[#8c8c8c]">
                          {tMedia("subDub")}
                        </span>
                      ) : isDubbed ? (
                        <span className="text-sm text-[#8c8c8c]">
                          {tMedia("dubbed")}
                        </span>
                      ) : (
                        <span className="text-sm text-[#8c8c8c]">
                          {tMedia("subtitled")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-zinc-100">
                      {displayLabel} {formattedNum}
                    </span>
                    {item.videoUrl && (
                      <span className="bg-blue-900/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-400 rounded-sm">
                        HD
                      </span>
                    )}
                  </div>
                  {item.title &&
                    item.title.trim() &&
                    !isGenericTitle(item.title, item.number) && (
                      <h4 className="line-clamp-1 text-xs text-zinc-400">
                        {item.title}
                      </h4>
                    )}
                </div>
              )}

              {/* Right button action (only shown for chapters) */}
              {itemType === "chapter" && (
                <div className="flex-shrink-0 ml-4">
                  <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white group-hover:bg-blue-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 rounded-md shadow-sm">
                    <BookOpen
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                    <span>{t("readNow")}</span>
                  </div>
                </div>
              )}

              {/* Hover overlay covering the whole card container (only for episodes) */}
              {itemType === "episode" && item.videoUrl && (
                <div className="hidden sm:flex absolute inset-0 bg-zinc-950 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex-col p-4 justify-between text-white z-20 pointer-events-none group-hover:pointer-events-auto">
                  <div className="flex flex-col gap-1">
                    {displayAnimeTitle && (
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider line-clamp-1">
                        {displayAnimeTitle}
                      </span>
                    )}
                    <h4 className="line-clamp-2 text-base font-normal text-white">
                      {item.title || `${displayLabel} ${formattedNum}`}
                    </h4>
                  </div>

                  <div className="w-full inline-flex items-center justify-center bg-blue-600 gap-2 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 mt-auto uppercase">
                    <PlayIcon size={20} />
                    {label === "Filme" || label.toLowerCase() === "movie"
                      ? t("watchMovie")
                      : t("playEpisode", { number: formattedNum })}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="w-full max-w-[1018px] mx-auto">
          <button
            onClick={showMore}
            className="bg-blue-600 w-full py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 uppercase"
          >
            {t("showMore")}
          </button>
        </div>
      )}
    </div>
  );
}

export function EpisodeListSkeleton({
  count,
  itemType,
}: {
  count?: number;
  itemType: "episode" | "chapter";
}) {
  const defaultCount = count ?? (itemType === "chapter" ? 24 : 12);
  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {Array.from({ length: defaultCount }).map((_, idx) => (
          <div key={idx} className="w-full">
            {itemType === "episode" ? (
              <div className="flex gap-3 overflow-hidden flex-row sm:flex-col w-full">
                <div className="relative aspect-video w-38 sm:w-full flex-shrink-0 bg-zinc-800 animate-pulse rounded-sm" />
                <div className="flex flex-col gap-2 flex-1 justify-center sm:justify-start py-1">
                  {/* Anime Title skeleton */}
                  <div className="h-3 w-1/3 bg-zinc-800 animate-pulse rounded-sm" />
                  {/* Episode Title skeleton */}
                  <div className="h-4 w-3/4 bg-zinc-800 animate-pulse rounded-sm" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-zinc-900/10 border border-zinc-800/80 rounded-md w-full">
                <div className="flex flex-col gap-1.5 flex-1">
                  {/* Chapter number skeleton */}
                  <div className="h-4.5 w-24 bg-zinc-800 animate-pulse rounded-sm" />
                  {/* Chapter Title skeleton */}
                  <div className="h-3 w-40 bg-zinc-800 animate-pulse rounded-sm" />
                </div>

                {/* Read button skeleton */}
                <div className="flex-shrink-0 ml-4">
                  <div className="h-8 w-24 bg-zinc-800 animate-pulse rounded-md" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

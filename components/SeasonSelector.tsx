"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import EpisodeList from "./EpisodeList";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
}

interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

interface SeasonSelectorProps {
  seasons: Season[];
  animeSlug: string;
  animeTitle?: string | null;
  animeRating?: string | null;
  animeDuration?: string | null;
  baseUrl?: string;
}

export default function SeasonSelector({
  seasons,
  animeSlug,
  animeTitle,
  animeRating,
  animeDuration,
  baseUrl,
}: SeasonSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"oldest" | "newest">("oldest");

  const currentSeason = seasons[currentIndex];

  if (!currentSeason) return null;

  const sortedEpisodes = [...currentSeason.episodes].sort((a, b) => {
    if (sortBy === "oldest") {
      return a.number - b.number;
    } else {
      return b.number - a.number;
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="relative inline-block">
          <button
            onClick={() => seasons.length > 1 && setIsOpen(!isOpen)}
            className={`flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50 ${
              seasons.length > 1
                ? "cursor-pointer hover:text-blue-500 transition-colors"
                : ""
            }`}
          >
            Temporada {currentSeason.number}
            {seasons.length > 1 && (
              <ChevronDown
                className={`h-6 w-6 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            )}
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-2 py-2 w-60 overflow-hidden border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                {seasons.map((season, index) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between ${
                      index === currentIndex
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <span>Temporada {season.number}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                      {season.episodes.length} episódios
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative inline-block">
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className={`flex items-center p-2 gap-2 text-sm font-bold transition-colors cursor-pointer uppercase ${
              isSortOpen
                ? "bg-zinc-100 text-blue-500 dark:bg-zinc-800 dark:text-blue-400"
                : "text-zinc-700 dark:text-zinc-300 hover:text-blue-500 hover:bg-zinc-100 hover:dark:bg-zinc-900"
            }`}
          >
            <span>
              {sortBy === "oldest" ? "mais antigos" : "mais recentes"}
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isSortOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSortOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 py-2 w-40 overflow-hidden border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 ">
                <button
                  onClick={() => {
                    setSortBy("oldest");
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between ${
                    sortBy === "oldest"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>Mais antigos</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("newest");
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-base font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between ${
                    sortBy === "newest"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>Mais recentes</span>
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
      />

      {seasons.length > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
          <button
            onClick={() =>
              currentIndex > 0 && setCurrentIndex(currentIndex - 1)
            }
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="flex items-center gap-1">
              <span className="hidden sm:flex">Temporada </span>
              Anterior
            </span>
          </button>

          <button
            onClick={() =>
              currentIndex < seasons.length - 1 &&
              setCurrentIndex(currentIndex + 1)
            }
            disabled={currentIndex === seasons.length - 1}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer uppercase"
          >
            <span className="flex items-center gap-1">
              Próxima
              <span className="hidden sm:flex">Temporada </span>
            </span>

            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

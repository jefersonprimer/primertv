"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import EpisodeList from "./EpisodeList";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  videoUrl?: string | null;
}

interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

interface SeasonSelectorProps {
  seasons: Season[];
  animeSlug: string;
}

export default function SeasonSelector({
  seasons,
  animeSlug,
}: SeasonSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const currentSeason = seasons[currentIndex];

  if (!currentSeason) return null;

  return (
    <div className="flex flex-col gap-8">
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

      <EpisodeList
        key={currentSeason.id}
        items={currentSeason.episodes}
        baseUrl={`/animes/${animeSlug}/episode`}
        itemType="episode"
      />

      {seasons.length > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-2">
          <button
            onClick={() =>
              currentIndex > 0 && setCurrentIndex(currentIndex - 1)
            }
            disabled={currentIndex === 0}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Temporada Anterior</span>
          </button>

          <button
            onClick={() =>
              currentIndex < seasons.length - 1 &&
              setCurrentIndex(currentIndex + 1)
            }
            disabled={currentIndex === seasons.length - 1}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <span>Próxima Temporada</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
            <div className="absolute left-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              {seasons.map((season, index) => (
                <button
                  key={season.id}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                    index === currentIndex
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  Temporada {season.number}
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
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface Episode {
  id: string;
  number: number;
  title: string | null;
  videoUrl: string | null;
}

interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

interface EpisodeSidebarProps {
  seasons: Season[];
  currentEpisodeId: string;
  novelaSlug: string;
  novelaImageUrl: string | null;
}

export default function EpisodeSidebar({
  seasons,
  currentEpisodeId,
  novelaSlug,
  novelaImageUrl,
}: EpisodeSidebarProps) {
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
                  <h3 className="font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Próximo
                  </h3>
                  <EpisodeCard
                    ep={nextEpisode}
                    novelaSlug={novelaSlug}
                    novelaImageUrl={novelaImageUrl}
                  />
                </div>
              )}
            </>
          ) : (
            /* From second episode onwards */
            <>
              {nextEpisode && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Próximo capítulo
                  </h3>
                  <EpisodeCard
                    ep={nextEpisode}
                    novelaSlug={novelaSlug}
                    novelaImageUrl={novelaImageUrl}
                  />
                </div>
              )}
              {prevEpisode && (
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Capítulo Anterior
                  </h3>
                  <EpisodeCard
                    ep={prevEpisode}
                    novelaSlug={novelaSlug}
                    novelaImageUrl={novelaImageUrl}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 2. "Ver mais capítulos" Button */}
      <button
        onClick={handleToggleShowAll}
        className="w-full py-2.5 px-4 bg-zinc-200 dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-zinc-50 transition-all hover:bg-zinc-300 dark:hover:bg-zinc-700 active:scale-95 text-center uppercase tracking-wide border border-zinc-300 dark:border-zinc-700"
      >
        {showAllEpisodes ? "Voltar para resumo" : "Ver mais capítulos"}
      </button>

      {/* 3. Season Selector & Episode List (shown if showAllEpisodes is true) */}
      {showAllEpisodes && (
        <div className="flex flex-col gap-4 bg-zinc-900 shadow-sm">
          {/* Season Dropdown */}
          <div className="relative w-full" ref={seasonRef}>
            <button
              onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-50 transition-colors"
            >
              <span>
                Temporada {selectedSeason ? selectedSeason.number : "1"}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  seasonDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {seasonDropdownOpen && (
              <div className="absolute left-0 right-0 z-50 mt-1 py-2 max-h-60 overflow-y-auto border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      setSelectedSeasonId(season.id);
                      setSeasonDropdownOpen(false);
                      setVisibleCount(12);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      season.id === selectedSeasonId
                        ? "bg-blue-50 text-blue-600 font-bold dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    Temporada {season.number}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Episode List */}
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            <div className="flex flex-col">
              {episodesOfSelectedSeason.slice(0, visibleCount).map((ep) => {
                const isCurrent = ep.id === currentEpisodeId;
                return (
                  <EpisodeCard
                    key={ep.id}
                    ep={ep}
                    novelaSlug={novelaSlug}
                    novelaImageUrl={novelaImageUrl}
                    isCurrent={isCurrent}
                  />
                );
              })}
            </div>

            {episodesOfSelectedSeason.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="w-full mt-2 py-2 px-4 bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-50 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 text-center uppercase tracking-wide border border-zinc-200 dark:border-zinc-700"
              >
                Mostrar mais
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
  novelaSlug: string;
  novelaImageUrl: string | null;
  isCurrent?: boolean;
}

function EpisodeCard({
  ep,
  novelaSlug,
  novelaImageUrl,
  isCurrent = false,
}: EpisodeCardProps) {
  return (
    <Link
      href={`/novelas/${novelaSlug}/episode/${ep.id}`}
      className={`flex items-center gap-3 p-2 transition-colors ${
        isCurrent
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-500"
          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-800"
      }`}
    >
      {/* Left: Image Container */}
      <div className="relative aspect-video w-38 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
        {novelaImageUrl ? (
          <Image
            src={novelaImageUrl}
            alt={ep.title || `Capítulo ${ep.number}`}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-xs text-zinc-500">
            Sem imagem
          </div>
        )}
      </div>

      {/* Right: Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs text-zinc-500 font-semibold mb-0.5">
          Capítulo {ep.number}
        </span>
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate leading-snug">
          {ep.title || `Capítulo ${ep.number}`}
        </h4>
      </div>
    </Link>
  );
}

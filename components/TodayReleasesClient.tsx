"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Play } from "lucide-react";

interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  releaseDay: number;
  releaseTime: string;
  lastEpisode: number;
  latestEpisodeId: string | null;
  episodeImageUrl: string | null;
  episodeNumbers?: number[];
}

interface TodayReleasesClientProps {
  animes: AnimeItem[];
}

export function TodayReleasesClient({ animes }: TodayReleasesClientProps) {
  const [showMore, setShowMore] = useState(false);
  const [currentDay, setCurrentDay] = useState<number>(-1);

  useEffect(() => {
    setCurrentDay(new Date().getDay());
  }, []);

  if (currentDay === -1) {
    return null;
  }

  const yesterday = (currentDay - 1 + 7) % 7;
  const dayBeforeYesterday = (currentDay - 2 + 7) % 7;

  // Filter animes
  const todayAnimes = animes.filter((anime) => anime.releaseDay === currentDay);
  const yesterdayAnimes = animes.filter(
    (anime) => anime.releaseDay === yesterday,
  );
  const dayBeforeAnimes = animes.filter(
    (anime) => anime.releaseDay === dayBeforeYesterday,
  );

  function getDayName(releaseDay: number) {
    const dayNames = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    return dayNames[releaseDay];
  }

  const renderAnimeCard = (
    anime: AnimeItem,
    isToday: boolean,
    dayLabel: string,
  ) => {
    const episodeNumbers = anime.episodeNumbers || [];
    const showEllipsis = episodeNumbers.length > 3;
    const displayPills = showEllipsis
      ? episodeNumbers.slice(0, 2)
      : episodeNumbers.slice(0, -1);
    const singleEpisodeRelease = episodeNumbers.length === 1;
    const bannerImageUrl = anime.bannerUrl || anime.imageUrl;
    const showEpisodeHover =
      singleEpisodeRelease &&
      Boolean(anime.episodeImageUrl) &&
      Boolean(bannerImageUrl);
    const cardHref =
      singleEpisodeRelease && anime.latestEpisodeId
        ? `/animes/${anime.slug}/episode/${anime.latestEpisodeId}`
        : `/animes/${anime.slug}`;
    const multipleEpisodeRelease = episodeNumbers.length > 1;

    return (
      <div
        key={`${anime.id}-${anime.releaseDay}`}
        className="group flex gap-4 p-3 hover:bg-zinc-50/50 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 hover:dark:bg-zinc-900/30 hover:cursor-pointer"
      >
        {/* Left: Image Banner */}
        <div
          className={`relative flex-shrink-0 ${
            multipleEpisodeRelease ? "pt-2 pr-3" : ""
          }`}
        >
          {multipleEpisodeRelease &&
            [3, 2, 1].map((depth) => (
              <div
                key={depth}
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 aspect-[16/10] w-28 sm:w-36 overflow-hidden border border-zinc-200/70 shadow-sm dark:border-zinc-700/60"
                style={{
                  transform: `translate(${depth * 3}px, ${-depth * 2.5}px)`,
                  zIndex: 4 - depth,
                }}
              >
                {bannerImageUrl && (
                  <div
                    className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-[1.5px]"
                    style={{ backgroundImage: `url(${bannerImageUrl})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/95 via-zinc-100/90 to-zinc-300/85 dark:from-zinc-800/95 dark:via-zinc-850/90 dark:to-zinc-700/85" />
              </div>
            ))}

          <Link
            href={cardHref}
            className={`relative block aspect-[16/10] w-28 sm:w-36 overflow-hidden bg-zinc-200 shadow-sm dark:bg-zinc-950 ${
              multipleEpisodeRelease
                ? "z-10 ring-1 ring-black/5 shadow-md dark:ring-white/10"
                : ""
            }`}
          >
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={anime.title}
              fill
              sizes="(max-width: 768px) 112px, 144px"
              className={`object-cover transition-all duration-500 ${
                showEpisodeHover
                  ? "opacity-100 group-hover:opacity-0 group-hover:scale-105"
                  : "group-hover:scale-105"
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              Sem Imagem
            </div>
          )}
          {showEpisodeHover && anime.episodeImageUrl && (
            <Image
              src={anime.episodeImageUrl}
              alt={`Episódio ${anime.lastEpisode} de ${anime.title}`}
              fill
              sizes="(max-width: 768px) 112px, 144px"
              className="absolute inset-0 object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
          </Link>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
          <div>
            {/* Anime Title */}
            <Link
              href={cardHref}
              className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-500 transition-colors line-clamp-1 leading-snug"
            >
              {anime.title}
            </Link>

            {/* Episode pills progress */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mr-0.5">
                Episódios:
              </span>
              {episodeNumbers.length === 0 ? (
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 italic">
                  Sem episódios
                </span>
              ) : (
                <>
                  {displayPills.map((num) => (
                    <span
                      key={num}
                      className="flex h-4 min-w-4 items-center justify-center rounded bg-zinc-150 px-1 text-[9px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                      {num}
                    </span>
                  ))}
                  {showEllipsis && (
                    <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-650 mx-0.5">
                      ...
                    </span>
                  )}
                  <Link
                    href={
                      anime.latestEpisodeId
                        ? `/animes/${anime.slug}/episode/${anime.latestEpisodeId}`
                        : `/animes/${anime.slug}`
                    }
                    className="flex h-4 min-w-4 items-center justify-center rounded border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 px-1 text-[9px] font-bold text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400 transition-colors"
                  >
                    {anime.lastEpisode}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Release time */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-3">
            <Clock className="h-3.5 w-3.5" />
            <span
              className={
                isToday ? "text-green-600 dark:text-green-400 font-medium" : ""
              }
            >
              {dayLabel} às {anime.releaseTime}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-2xl">
            Novos Lançamentos
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
            Fique por dentro das novidades do calendário semanal de lançamentos.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Today Section */}
        {todayAnimes.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-base sm:text-[22px] font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-150 pb-2 dark:border-zinc-800 flex items-center gap-2">
              Hoje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {todayAnimes.map((anime) => renderAnimeCard(anime, true, "Hoje"))}
            </div>
          </div>
        ) : (
          !showMore && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
              <Clock className="h-10 w-10 text-zinc-400" />
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                Nenhum lançamento registrado para hoje.
              </p>
            </div>
          )
        )}

        {/* Yesterday Section */}
        {showMore &&
          (yesterdayAnimes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-base sm:text-[22px] font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-150 pb-2 dark:border-zinc-800 flex items-center gap-2">
                Ontem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {yesterdayAnimes.map((anime) =>
                  renderAnimeCard(anime, false, "Ontem"),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-base sm:text-[22px] font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-150 pb-2 dark:border-zinc-800 flex items-center gap-2">
                Ontem
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                Nenhum lançamento registrado para ontem.
              </p>
            </div>
          ))}

        {/* Day Before Yesterday Section */}
        {showMore &&
          (dayBeforeAnimes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-base sm:text-[22px] font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-150 pb-2 dark:border-zinc-800 flex items-center gap-2">
                {getDayName(dayBeforeYesterday)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {dayBeforeAnimes.map((anime) =>
                  renderAnimeCard(anime, false, getDayName(dayBeforeYesterday)),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-base sm:text-[22px] font-bold text-zinc-900 dark:text-white border-b-2 border-zinc-150 pb-2 dark:border-zinc-800 flex items-center gap-2">
                {getDayName(dayBeforeYesterday)}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                Nenhum lançamento registrado para este dia.
              </p>
            </div>
          ))}
      </div>

      {/* Button Row */}
      <div className="w-full max-w-[1018px] mx-auto mt-8">
        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="bg-zinc-900 w-full py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Mostrar mais
          </button>
        ) : (
          <Link
            href="/calendario"
            className="flex items-center justify-center bg-zinc-900 w-full py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Ver calendário de lançamentos
          </Link>
        )}
      </div>
    </div>
  );
}

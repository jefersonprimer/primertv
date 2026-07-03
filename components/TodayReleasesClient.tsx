"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ChevronRight, Clock, Play } from "lucide-react";
import RatingBadge from "@/components/RatingBadge";

interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  rating?: string | null;
  releaseDay: number;
  releaseTime: string;
  lastEpisode: number;
  latestEpisodeId: string | null;
  latestEpisodePublicId?: string | null;
  latestEpisodeSlug?: string | null;
  episodeImageUrl: string | null;
  episodeNumbers?: number[];
}

interface TodayReleasesClientProps {
  animes: AnimeItem[];
}

export function TodayReleasesClient({ animes }: TodayReleasesClientProps) {
  const [showMore, setShowMore] = useState(false);
  const [currentDay] = useState(() => new Date().getDay());

  const yesterday = (currentDay - 1 + 7) % 7;
  const dayBeforeYesterday = (currentDay - 2 + 7) % 7;

  // Filter animes
  const todayAnimes = animes.filter(
    (anime) =>
      anime.releaseDay === currentDay &&
      anime.episodeNumbers &&
      anime.episodeNumbers.length > 0,
  );
  const yesterdayAnimes = animes.filter(
    (anime) =>
      anime.releaseDay === yesterday &&
      anime.episodeNumbers &&
      anime.episodeNumbers.length > 0,
  );
  const dayBeforeAnimes = animes.filter(
    (anime) =>
      anime.releaseDay === dayBeforeYesterday &&
      anime.episodeNumbers &&
      anime.episodeNumbers.length > 0,
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
        ? anime.latestEpisodePublicId
          ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episodio-" + anime.lastEpisode}`
          : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episodio-" + anime.lastEpisode}`
        : `/animes/${anime.slug}`;
    const multipleEpisodeRelease = episodeNumbers.length > 1;

    return (
      <div
        key={`${anime.id}-${anime.releaseDay}`}
        className="group flex gap-4 p-0 sm:p-2 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-300 hover:bg-[#272727] hover:cursor-pointer"
      >
        {/* Left: Image Banner */}
        <div className="relative flex-shrink-0 w-38 sm:w-36 aspect-[16/9]">
          {multipleEpisodeRelease &&
            [3, 2, 1].map((depth) => (
              <div
                key={depth}
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 overflow-hidden border border-zinc-200/70 shadow-sm dark:border-zinc-700/60 bg-zinc-200 dark:bg-zinc-950"
                style={{
                  width: "calc(100% - 9px)",
                  height: "calc(100% - 7.5px)",
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
            className={`absolute bottom-0 left-0 block overflow-hidden bg-zinc-200 shadow-sm dark:bg-zinc-950 ${
              multipleEpisodeRelease
                ? "z-10 ring-1 ring-black/5 shadow-md dark:ring-white/10"
                : ""
            }`}
            style={{
              width: multipleEpisodeRelease ? "calc(100% - 9px)" : "100%",
              height: multipleEpisodeRelease ? "calc(100% - 7.5px)" : "100%",
            }}
          >
            {anime.rating && (
              <div className="absolute top-1 left-1 z-20 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <RatingBadge rating={anime.rating} size={16} />
              </div>
            )}
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

            {singleEpisodeRelease && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-black/60 p-3 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 scale-90 group-hover:scale-100">
                  <Play className="h-6 w-6 text-white fill-current ml-0.5" />
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
          <div>
            {/* Anime Title */}
            <Link
              href={cardHref}
              className={`text-sm font-bold text-[#f2f2f2] hover:text-white transition-colors line-clamp-2 leading-snug
                ${multipleEpisodeRelease ? "" : "hover:underline"}`}
            >
              {anime.title}
            </Link>

            {/* Episode pills progress */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {episodeNumbers.length === 0 ? (
                <>
                  <span className="text-sm font-medium text-[#bbb]">
                    {" "}
                    Episódio{" "}
                  </span>
                  <span className="text-sm text-zinc-500">Sem episódios</span>
                </>
              ) : episodeNumbers.length > 1 ? (
                <>
                  <Link
                    href={
                      anime.latestEpisodeId
                        ? anime.latestEpisodePublicId
                          ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episodio-" + anime.lastEpisode}`
                          : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episodio-" + anime.lastEpisode}`
                        : `/animes/${anime.slug}`
                    }
                    className="flex h-4 min-w-4 items-center justify-center text-xs font-medium text-[#bbb] transition-colors"
                  >
                    {anime.lastEpisode}
                  </Link>
                  <span className="text-sm font-medium text-[#bbb]">
                    Episódios
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-[#bbb]">
                    {" "}
                    Episódio{" "}
                  </span>
                  {displayPills.map((num) => (
                    <span
                      key={num}
                      className="flex h-4 min-w-4 items-center justify-center rounded bg-zinc-150 text-xs font-medium text-[#bbb]"
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
                        ? anime.latestEpisodePublicId
                          ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episodio-" + anime.lastEpisode}`
                          : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episodio-" + anime.lastEpisode}`
                        : `/animes/${anime.slug}`
                    }
                    className="flex h-4 min-w-4 items-center justify-center text-xs font-medium text-[#bbb] transition-colors"
                  >
                    {anime.lastEpisode}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Release time */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#bbb]">
            <Clock className="h-3 w-3" />
            <span className={isToday ? "font-medium" : ""}>
              {dayLabel} às {anime.releaseTime}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-6">
      {/* Title Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-white text-[22px] md:text-[28px] font-bold tracking-tight ">
          <Calendar size={24} />
          Novos Lançamentos
        </h2>

        <div className="flex items-center gap-2 text-[#bbb] hover:text-white hover:cursor-pointer">
          <Link
            href="/calendario"
            className="text-sm font-bold uppercase hidden sm:flex"
          >
            ver calendario de lancamentos
          </Link>
          <ChevronRight size="24" />
        </div>
      </div>

      <div className="space-y-8">
        {/* Today Section */}
        {todayAnimes.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
              Hoje
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {todayAnimes.map((anime) => renderAnimeCard(anime, true, "Hoje"))}
            </div>
          </div>
        ) : (
          !showMore && (
            <div className="flex flex-col items-center justify-center border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
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
            <div className="space-y-2">
              <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
                Ontem
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {yesterdayAnimes.map((anime) =>
                  renderAnimeCard(anime, false, "Ontem"),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
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
            <div className="space-y-2">
              <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
                {getDayName(dayBeforeYesterday)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {dayBeforeAnimes.map((anime) =>
                  renderAnimeCard(anime, false, getDayName(dayBeforeYesterday)),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
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
            className="bg-zinc-900 w-full py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700 uppercase"
          >
            mostrar mais
          </button>
        ) : (
          <Link
            href="/calendario"
            className="flex items-center justify-center bg-zinc-900 w-full py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700 uppercase"
          >
            ver calendário de lançamentos
          </Link>
        )}
      </div>
    </div>
  );
}

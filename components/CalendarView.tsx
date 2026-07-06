"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Clock, Tv, Play, Loader2 } from "lucide-react";
import { WatchlistButton } from "@/components/WatchlistButton";

interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  releaseDay: number; // 0 = Domingo, 1 = Segunda, etc.
  releaseTime: string; // ex: "6:00 am"
  lastEpisode: number;
  latestEpisodeId: string | null;
  latestEpisodePublicId?: string | null;
  latestEpisodeSlug?: string | null;
  episodeImageUrl: string | null;
  inWatchlist?: boolean;
  episodeNumbers?: number[];
  isComingSoon?: boolean;
}

interface CalendarViewProps {
  animes: AnimeItem[];
  isLoggedIn: boolean;
}

export function CalendarView({ animes, isLoggedIn }: CalendarViewProps) {
  const t = useTranslations("CalendarPage");
  const tWeekdays = useTranslations("Weekdays");
  const [currentDay] = useState(() => new Date().getDay());
  const [activeDay, setActiveDay] = useState<number>(() => new Date().getDay());

  const DAYS_OF_WEEK = [
    { value: 0, label: tWeekdays("sunday"), shortLabel: tWeekdays("sun") },
    { value: 1, label: tWeekdays("monday"), shortLabel: tWeekdays("mon") },
    { value: 2, label: tWeekdays("tuesday"), shortLabel: tWeekdays("tue") },
    { value: 3, label: tWeekdays("wednesday"), shortLabel: tWeekdays("wed") },
    { value: 4, label: tWeekdays("thursday"), shortLabel: tWeekdays("thu") },
    { value: 5, label: tWeekdays("friday"), shortLabel: tWeekdays("fri") },
    { value: 6, label: tWeekdays("saturday"), shortLabel: tWeekdays("sat") },
  ];

  const groupedAnimes = animes.reduce(
    (acc, anime) => {
      if (!acc[anime.releaseDay]) {
        acc[anime.releaseDay] = [];
      }
      acc[anime.releaseDay].push(anime);
      return acc;
    },
    {} as Record<number, AnimeItem[]>,
  );

  return (
    <div className="w-full">
      {/* Header Info */}
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            {t("weeklyCalendar")}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            {t("scheduleDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md p-2 text-xs font-medium bg-zinc-800 text-zinc-300">
          <Clock className="h-3.5 w-3.5" />
          {t("timezoneInfo")}
        </div>
      </div>

      {/* Tabs Mobile (Horizontal Scroll) */}
      <div className="no-scrollbar -mx-4 mb-6 flex overflow-x-auto px-4 pb-2 md:hidden">
        <div className="flex gap-1.5">
          {DAYS_OF_WEEK.map((day) => {
            const isActive = activeDay === day.value;
            const isToday = currentDay === day.value;
            const count = groupedAnimes[day.value]?.length || 0;

            return (
              <button
                key={day.value}
                onClick={() => setActiveDay(day.value)}
                className={`relative flex flex-col items-center min-w-[70px] px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400"
                }`}
              >
                <span>{day.shortLabel}</span>
                {isToday && (
                  <span
                    className={`mt-1 h-1.5 w-1.5 ${
                      isActive ? "bg-white" : "bg-blue-500"
                    }`}
                  />
                )}
                {count > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold ${
                      isActive
                        ? "bg-white text-blue-600"
                        : "text-white bg-blue-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Active Column View */}
      <div className="block md:hidden">
        <div className="p-4 shadow-sm border bg-zinc-950 border-zinc-900">
          <div className="mb-4 flex items-center justify-between border-b pb-3 border-zinc-900">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 bg-blue-600" />
              {DAYS_OF_WEEK.find((d) => d.value === activeDay)?.label}
            </h2>
            <span className="text-xs font-medium text-zinc-400">
              {t("releasesCount", {
                count: groupedAnimes[activeDay]?.length || 0,
              })}
            </span>
          </div>

          {groupedAnimes[activeDay]?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tv className="h-10 w-10 text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-400">
                {t("noReleasesToday")}
              </p>
            </div>
          ) : (
            <div className="relative pl-4 border-l border-zinc-800 flex flex-col gap-6 ml-2">
              {groupedAnimes[activeDay]?.map((anime) => (
                <AnimeCalendarCard
                  key={anime.id}
                  anime={anime}
                  isLoggedIn={isLoggedIn}
                  isToday={activeDay === currentDay}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Column Grid */}
      <div className="hidden md:grid md:grid-cols-7 items-start">
        {DAYS_OF_WEEK.map((day) => {
          const isToday = currentDay === day.value;
          const dayList = groupedAnimes[day.value] || [];

          return (
            <div
              key={day.value}
              className={`flex flex-col pl-4 pr-2 pb-4 border-l transition-all duration-300 relative ${
                isToday
                  ? "border-blue-500/70 bg-blue-500/[0.02]"
                  : "border-zinc-800"
              }`}
            >
              {/* Day Header */}
              <div className="mb-4 flex flex-col gap-1 pb-2">
                <span
                  className={`text-sm font-bold truncate ${
                    isToday
                      ? "text-blue-500"
                      : "text-white"
                  }`}
                >
                  {day.label.split("-")[0]}
                </span>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{isToday ? t("todayLabel") : t("releaseLabel")}</span>
                  <span className="font-semibold">{dayList.length}</span>
                </div>
              </div>

              {/* Anime Cards Stack */}
              {dayList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-zinc-800/80">
                  <Tv className="h-6 w-6 text-zinc-800" />
                  <span className="mt-2 text-[10px] text-zinc-500">
                    {t("empty")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {dayList.map((anime) => (
                    <AnimeCalendarCard
                      key={anime.id}
                      anime={anime}
                      isLoggedIn={isLoggedIn}
                      isToday={isToday}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimeCalendarCard({
  anime,
  isLoggedIn,
  isToday,
}: {
  anime: AnimeItem;
  isLoggedIn: boolean;
  isToday: boolean;
}) {
  const t = useTranslations("CalendarPage");
  const [isLoading, setIsLoading] = useState(true);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    setIsLoading(true);
    hoverTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsLoading(true);
  };

  // Decide position of hover popover: left-full or right-full
  const popoverPositionClass =
    anime.releaseDay >= 4
      ? "right-full mr-3 origin-right before:left-full before:right-auto"
      : "left-full ml-3 origin-left before:right-full before:left-auto";

  // Decide position of hover popover arrow
  const arrowPositionClass =
    anime.releaseDay >= 4
      ? "right-0 translate-x-1/2 border-t border-r"
      : "left-0 -translate-x-1/2 border-b border-l";

  return (
    <div
      className="group relative hover:z-50 flex flex-col transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Timeline Dot (Bolinha no horário) */}
      <div
        className={`absolute left-[-16px] -translate-x-1/2 top-[2.5px] z-10 rounded-full border-2 transition-all duration-300 ${
          isToday
            ? "w-3 h-3 bg-blue-500 border-zinc-950 scale-110 shadow-sm shadow-blue-500/50"
            : "w-2.5 h-2.5 bg-zinc-600 border-zinc-950"
        }`}
      />

      {/* Horário */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400">
        <Clock className="h-3 w-3 text-zinc-400" />
        <span>{anime.releaseTime}</span>
      </div>

      {/* Nome do Anime */}
      <Link
        href={`/animes/${anime.slug}`}
        className="mt-1 block text-xs font-bold text-zinc-100 hover:text-blue-500 transition-colors line-clamp-2 leading-snug"
        title={anime.title}
      >
        {anime.title}
      </Link>

      {/* Status do Episódio */}
      <div className="mt-1 text-[10px] font-medium text-zinc-400">
        {anime.isComingSoon ? (
          <span className="text-blue-400 font-semibold">
            {t("comingSoon")}
          </span>
        ) : isToday ? (
          <span>{t("episodeAvailable", { number: anime.lastEpisode })}</span>
        ) : (
          <span>
            {anime.lastEpisode <= 1
              ? t("episodeAvailable", { number: anime.lastEpisode })
              : t("episodesAvailable", { number: anime.lastEpisode })}
          </span>
        )}
      </div>

      {/* Imagem do Episódio (Apenas se for Hoje) */}
      {isToday && (
        <Link
          href={
            anime.latestEpisodeId
              ? anime.latestEpisodePublicId
                ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
              : `/animes/${anime.slug}`
          }
          className="relative mt-2 block aspect-[16/10] w-full overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-xs group/episode"
        >
          {anime.episodeImageUrl ? (
            <Image
              src={anime.episodeImageUrl}
              alt={`Episódio ${anime.lastEpisode}`}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover transition-transform duration-300 group-hover/episode:scale-105"
            />
          ) : anime.imageUrl ? (
            <Image
              src={anime.imageUrl}
              alt={`Episódio ${anime.lastEpisode}`}
              fill
              sizes="(max-width: 768px) 100vw, 200px"
              className="object-cover transition-transform duration-300 group-hover/episode:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
              {t("noImage")}
            </div>
          )}

          {/* Badge no canto superior esquerdo */}
          <div className="absolute top-0 left-0 bg-black/80 text-white font-extrabold text-xs rounded-br px-2 py-0.5 shadow-sm backdrop-blur-xs">
            {anime.lastEpisode}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/episode:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </Link>
      )}

      {/* Popover Hover Modal */}
      <div
        className={`absolute top-0 z-[100] ${popoverPositionClass} pointer-events-none invisible opacity-0 scale-95 transition-all duration-250 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-hover:scale-100 hidden lg:flex flex-col w-[380px] bg-zinc-950 border border-zinc-800 shadow-2xl p-4 before:absolute before:top-0 before:bottom-0 before:w-4 before:content-['']`}
      >
        {/* Arrow pointer pointing to the card */}
        <div
          className={`absolute top-6 w-3 h-3 rotate-45 bg-zinc-950 border-zinc-800 ${arrowPositionClass}`}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="mt-2.5 text-xs text-zinc-400 font-medium">
              {t("loadingData")}
            </span>
          </div>
        ) : (
          <div className="transition-all duration-300 opacity-100 ease-out flex flex-col h-full">
            <div className="flex gap-4">
              {/* Left: Poster image */}
              <div className="relative aspect-[2/3] w-28 flex-shrink-0 overflow-hidden bg-zinc-900 shadow-md">
                {anime.imageUrl ? (
                  <Image
                    src={anime.imageUrl}
                    alt={anime.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                    {t("noImage")}
                  </div>
                )}
              </div>

              {/* Right: details */}
              <div className="flex flex-col flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight">
                  {anime.title}
                </h4>
                <p className="mt-2 text-[11px] text-zinc-400 line-clamp-4 leading-relaxed">
                  {anime.description || t("noDescription")}
                </p>

                {/* Buttons Row */}
                <div className="mt-auto pt-3 flex items-center gap-2">
                  {anime.isComingSoon ? (
                    <Link
                      href={`/animes/${anime.slug}`}
                      className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <Tv className="h-3.5 w-3.5" />
                      {t("viewDetails")}
                    </Link>
                  ) : (
                    <Link
                      href={
                        anime.latestEpisodeId
                          ? anime.latestEpisodePublicId
                            ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                            : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                          : `/animes/${anime.slug}`
                      }
                      className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <Play className="h-3 w-3 fill-current ml-0.5" />
                      {t("watchEpisode", { number: anime.lastEpisode })}
                    </Link>
                  )}
                  <WatchlistButton
                    mediaType="ANIME"
                    mediaId={anime.id}
                    slug={anime.slug}
                    initialInWatchlist={!!anime.inWatchlist}
                    isLoggedIn={isLoggedIn}
                    compact={true}
                  />
                </div>
              </div>
            </div>

            {/* Below all: Episode Image + Episode badge */}
            {!anime.isComingSoon && (
              <div className="mt-4 border-t border-zinc-900 pt-4 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  {t("latestReleasedEpisode")}
                </span>
                <Link
                  href={
                    anime.latestEpisodeId
                      ? anime.latestEpisodePublicId
                        ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                        : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                      : `/animes/${anime.slug}`
                  }
                  className="group/episode_popover relative block aspect-[16/9] w-full overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-inner"
                >
                  {anime.episodeImageUrl ? (
                    <Image
                      src={anime.episodeImageUrl}
                      alt={`Episódio ${anime.lastEpisode}`}
                      fill
                      sizes="348px"
                      className="object-cover transition-transform duration-500 group-hover/episode_popover:scale-105"
                    />
                  ) : anime.imageUrl ? (
                    <Image
                      src={anime.imageUrl}
                      alt={`Episódio ${anime.lastEpisode}`}
                      fill
                      sizes="348px"
                      className="object-cover opacity-60 blur-xs transition-transform duration-500 group-hover/episode_popover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                      {t("noEpisodeImage")}
                    </div>
                  )}

                  {/* Episode Number Badge in top-left */}
                  <div className="absolute top-0 left-0 bg-black/80 text-white font-black text-xs px-2 py-0.5 shadow-lg rounded-br tracking-wide z-20">
                    {anime.lastEpisode}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />

                  {/* Hover Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover/episode_popover:opacity-100 z-20">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 scale-90 group-hover/episode_popover:scale-100">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

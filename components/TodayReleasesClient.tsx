"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import Image from "next/image";
import { Calendar, ChevronRight, Clock, Play } from "lucide-react";
import RatingBadge from "@/components/RatingBadge";
import { Link } from "@/i18n/routing";

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
  const t = useTranslations("TodayReleases");
  const tWeekdays = useTranslations("Weekdays");
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
    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return tWeekdays(dayKeys[releaseDay]);
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
          ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
          : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
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
                className="pointer-events-none absolute bottom-0 left-0 overflow-hidden border  shadow-sm border-zinc-700/60 bg-zinc-950"
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
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/95 via-zinc-850/90 to-zinc-700/85" />
              </div>
            ))}

          <Link
            href={cardHref}
            className={`absolute bottom-0 left-0 block overflow-hidden shadow-sm bg-zinc-950 ${
              multipleEpisodeRelease
                ? "z-10 ring-1 shadow-md ring-white/10"
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
                {t("noImage")}
              </div>
            )}
            {showEpisodeHover && anime.episodeImageUrl && (
              <Image
                src={anime.episodeImageUrl}
                alt={t("episodeHoverAlt", {
                  episode: anime.lastEpisode,
                  title: anime.title,
                })}
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
                    {t("episode")}{" "}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {t("noEpisodes")}
                  </span>
                </>
              ) : episodeNumbers.length > 1 ? (
                <>
                  <Link
                    href={
                      anime.latestEpisodeId
                        ? anime.latestEpisodePublicId
                          ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                          : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                        : `/animes/${anime.slug}`
                    }
                    className="flex h-4 min-w-4 items-center justify-center text-xs font-medium text-[#bbb] transition-colors"
                  >
                    {anime.lastEpisode}
                  </Link>
                  <span className="text-sm font-medium text-[#bbb]">
                    {t("episodes")}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-[#bbb]">
                    {" "}
                    {t("episode")}{" "}
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
                    <span className="text-[9px] font-bold text-zinc-650 mx-0.5">
                      ...
                    </span>
                  )}
                  <Link
                    href={
                      anime.latestEpisodeId
                        ? anime.latestEpisodePublicId
                          ? `/watch/${anime.latestEpisodePublicId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
                          : `/watch/${anime.latestEpisodeId}/${anime.latestEpisodeSlug || "episode-" + anime.lastEpisode}`
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
              {t("releaseTimeFormat", {
                day: dayLabel,
                time: anime.releaseTime,
              })}
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
          {t("title")}
        </h2>

        <div className="flex items-center gap-2 text-[#bbb] hover:text-white hover:cursor-pointer">
          <Link
            href="/calendar"
            className="text-sm font-bold uppercase hidden sm:flex"
          >
            {t("viewCalendar")}
          </Link>
          <ChevronRight size="24" />
        </div>
      </div>

      <div className="space-y-8">
        {/* Today Section */}
        {todayAnimes.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
              {t("today")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {todayAnimes.map((anime) =>
                renderAnimeCard(anime, true, t("today")),
              )}
            </div>
          </div>
        ) : (
          !showMore && (
            <div className="flex flex-col items-center justify-center border border-dashed py-12 text-center border-zinc-800">
              <Clock className="h-10 w-10 text-zinc-400" />
              <p className="mt-3 text-sm text-zinc-400">
                {t("noReleasesToday")}
              </p>
            </div>
          )
        )}

        {/* Yesterday Section */}
        {showMore &&
          (yesterdayAnimes.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
                {t("yesterday")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {yesterdayAnimes.map((anime) =>
                  renderAnimeCard(anime, false, t("yesterday")),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-base sm:text-[22px] font-bold text-white border-b-2 pb-2 border-zinc-800">
                {t("yesterday")}
              </h3>
              <p className="text-xs text-zinc-400 italic">
                {t("noReleasesYesterday")}
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
              <p className="text-xs text-zinc-400 italic">
                {t("noReleasesDay")}
              </p>
            </div>
          ))}
      </div>

      {/* Button Row */}
      <div className="w-full max-w-[1018px] mx-auto mt-8">
        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="w-full py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 uppercase"
          >
            {t("showMore")}
          </button>
        ) : (
          <Link
            href="/calendar"
            className="flex items-center justify-center w-full py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 bg-blue-600 hover:bg-blue-700 uppercase"
          >
            {t("viewCalendar")}
          </Link>
        )}
      </div>
    </div>
  );
}

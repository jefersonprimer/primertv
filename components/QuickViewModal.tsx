"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Play,
  Info,
  Star,
  ChevronDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { StartWatchingButton } from "./StartWatchingButton";
import { WatchlistButton } from "./WatchlistButton";
import ShareButton from "./ShareButton";
import AddToListButton from "./AddToListButton";
import RatingBadge from "./RatingBadge";
import MediaDescription from "./MediaDescription";
import {
  getAnimeQuickPreview,
  type AnimeQuickPreviewData,
} from "@/app/actions/getAnimeQuickPreview";
import { getSeriesQuickPreview } from "@/app/actions/getSeriesQuickPreview";

interface QuickViewModalProps {
  slug: string | null;
  type?: "anime" | "series" | "movie" | "manga" | "novela";
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({
  slug,
  type = "anime",
  isOpen,
  onClose,
}: QuickViewModalProps) {
  const t = useTranslations("QuickViewModal");
  const [data, setData] = useState<AnimeQuickPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [mounted, setMounted] = useState(false);

  const basePath = type === "series" ? "series" : "animes";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !slug) {
      setData(null);
      setError(false);
      setVisibleCount(12);
      return;
    }

    setLoading(true);
    setError(false);

    const fetcher =
      type === "series" ? getSeriesQuickPreview : getAnimeQuickPreview;

    fetcher(slug)
      .then((resData) => {
        if (!resData) {
          setError(true);
        } else {
          setData(resData);
          const initialSeason =
            resData.nextEpisode?.seasonNumber ||
            resData.seasons?.[0]?.number ||
            1;
          setSelectedSeasonNumber(initialSeason);
          setVisibleCount(12);
        }
      })
      .catch((err) => {
        console.error("Erro QuickViewModal:", err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, slug, type]);

  const handleSeasonChange = (seasonNum: number) => {
    setSelectedSeasonNumber(seasonNum);
    setVisibleCount(12);
  };

  // Tecla ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquear scroll no fundo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const targetEpisode = data?.nextEpisode || data?.firstEpisode;
  const watchUrl = targetEpisode?.href
    ? targetEpisode.href
    : targetEpisode
      ? `/watch/${targetEpisode.publicId || targetEpisode.id}/${targetEpisode.slug || "episode-" + targetEpisode.number}`
      : `/animes/${slug}`;

  const headerBanner = data?.bannerUrl || data?.imageUrl;

  const buttonText = data?.hasHistory
    ? t("continueWatching", { number: targetEpisode?.number ?? 1 })
    : targetEpisode?.number
      ? t("watchEpisode", { number: targetEpisode.number })
      : t("startWatching");

  const formatDuration = (duration?: string | null): string => {
    if (!duration || duration.toLowerCase() === "unknown") return "";
    const matches = duration.match(/\d+/);
    if (matches) {
      return `${matches[0]}m`;
    }
    return "";
  };

  const currentSeason = data?.seasons?.find(
    (s) => s.number === selectedSeasonNumber,
  );
  const episodesList = currentSeason?.episodes || [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-[#141414] text-[#f2f2f2] shadow-2xl border border-zinc-800/80 z-10 flex flex-col max-h-[92vh]">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all border border-white/10"
          aria-label={t("close")}
        >
          <X size={24} />
        </button>

        {loading ? (
          <div className="overflow-y-auto custom-scrollbar flex flex-col animate-pulse">
            {/* Banner Skeleton */}
            <div className="relative aspect-16/9 w-full max-h-[340px] sm:max-h-[420px] md:max-h-[480px] bg-zinc-800/60 flex-shrink-0 flex items-end p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="h-11 w-36 bg-zinc-700/80 rounded-xl" />
                <div className="h-10 w-10 bg-zinc-700/80 rounded-full" />
                <div className="h-10 w-10 bg-zinc-700/80 rounded-full" />
                <div className="h-10 w-10 bg-zinc-700/80 rounded-full" />
                <div className="h-10 w-10 bg-zinc-700/80 rounded-full ml-auto" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-4 sm:p-6 flex flex-col gap-6">
              {/* Title & Badges Skeleton */}
              <div className="flex flex-col gap-3">
                <div className="h-8 w-2/3 bg-zinc-800 rounded-md" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-zinc-800 rounded-md" />
                  <div className="h-6 w-14 bg-zinc-800 rounded-md" />
                  <div className="h-6 w-16 bg-zinc-800 rounded-md" />
                  <div className="h-6 w-20 bg-zinc-800 rounded-md" />
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 w-full bg-zinc-800/80 rounded" />
                <div className="h-4 w-5/6 bg-zinc-800/80 rounded" />
                <div className="h-4 w-4/6 bg-zinc-800/80 rounded" />
              </div>

              {/* Episodes Section Skeleton */}
              <div className="flex flex-col gap-4 border-t border-zinc-800/80 pt-5">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-24 bg-zinc-800 rounded" />
                  <div className="h-9 w-36 bg-zinc-800 rounded-xl" />
                </div>

                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/70"
                    >
                      <div className="aspect-16/9 w-full sm:w-44 bg-zinc-800 rounded-lg flex-shrink-0" />
                      <div className="flex flex-col justify-center flex-1 gap-2">
                        <div className="h-5 w-3/4 bg-zinc-800 rounded" />
                        <div className="h-4 w-1/4 bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <p className="text-zinc-400">
              {t("failedToLoad")}
            </p>
            <Link
              href={`/${basePath}/${slug}`}
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-[#0077FD] hover:bg-[#0066D6] text-white text-sm font-bold transition-all"
            >
              {t("moreDetails")}
            </Link>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex flex-col">
            {/* Banner Header */}
            <div className="relative aspect-16/9 w-full max-h-[340px] sm:max-h-[420px] md:max-h-[480px] overflow-hidden bg-zinc-900 flex-shrink-0">
              {headerBanner ? (
                <Image
                  src={headerBanner}
                  alt={targetEpisode?.title || data.title}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-500 font-bold">
                  {data.title}
                </div>
              )}

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/80 via-transparent to-transparent" />

              {/* Conteúdo Inferior no Banner (Logo/Nome + Botões) */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-10 flex flex-col gap-3 sm:gap-4">
                {/* Logo ou Nome */}
                <Link
                  href={`/${basePath}/${data.slug}`}
                  onClick={onClose}
                  className="block max-w-[75%] sm:max-w-[60%] lg:max-w-[65%] hover:opacity-90 transition-opacity group cursor-pointer"
                >
                  {data.logoUrl ? (
                    <div className="relative aspect-[3/1] w-full max-w-[160px] sm:max-w-[240px] md:max-w-[300px] lg:max-w-[360px] xl:max-w-[400px]">
                      <Image
                        src={data.logoUrl}
                        alt={data.title}
                        fill
                        priority
                        className="object-contain object-left drop-shadow-md"
                      />
                    </div>
                  ) : (
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-md line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {data.title}
                    </h2>
                  )}
                </Link>

                {/* Botões Principais no Banner */}
                <div className="flex flex-wrap items-center gap-3">
                  <StartWatchingButton
                    href={watchUrl}
                    onClick={onClose}
                    text={buttonText}
                  />

                  <WatchlistButton
                    mediaType={type === "series" ? "SERIES" : "ANIME"}
                    mediaId={data.id}
                    slug={data.slug}
                    initialInWatchlist={data.inWatchlist}
                    isLoggedIn={data.isLoggedIn}
                    size={24}
                  />

                  <AddToListButton
                    animeId={type !== "series" ? data.id : undefined}
                    seriesId={type === "series" ? data.id : undefined}
                    isLoggedIn={data.isLoggedIn}
                    size={24}
                  />

                  <ShareButton
                    url={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/${basePath}/${data.slug}`
                        : undefined
                    }
                    size={24}
                  />

                  <Link
                    href={`/${basePath}/${data.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2 p-2 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white text-sm font-semibold border border-zinc-700/60 hover:border-zinc-500 transition-all ml-auto"
                  >
                    <Info size={24} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Conteúdo com Informações Detalhadas */}
            <div className="p-4 sm:p-6 flex flex-col gap-6">
              {/* Título & Badges */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-zinc-300">
                  {data.rating && (
                    <RatingBadge rating={data.rating} size={22} />
                  )}

                  {data.score && (
                    <div className="flex items-center justify-center gap-1 text-sm font-medium text-[#bbb] px-1 py-0.5 bg-zinc-800/60 rounded-md border border-zinc-700/40">
                      <span>{data.score.toFixed(1)}</span>

                      <Star size={16} fill="#bbb" />
                    </div>
                  )}

                  {data.year && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                      {data.year}
                    </span>
                  )}

                  {data.seasons && data.seasons.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                      {data.seasons.length}{" "}
                      {data.seasons.length === 1 ? t("season") : t("seasons")}
                    </span>
                  )}
                </div>
              </div>

              {/* Sinopse / MediaDescription */}
              {data.description && (
                <MediaDescription
                  description={data.description}
                  rating={data.rating || undefined}
                  genres={data.genres}
                  year={data.year}
                  awards={data.awards}
                  audio={data.audio}
                  subtitles={data.subtitles}
                  className="text-zinc-300/90 text-sm sm:text-base"
                />
              )}

              {/* Seção de Episódios & Dropdown de Temporadas */}
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {t("episodes")}
                  </h3>

                  {/* Dropdown de Temporadas */}
                  {data.seasons && data.seasons.length > 0 && (
                    <div className="relative inline-block">
                      <select
                        value={selectedSeasonNumber}
                        onChange={(e) =>
                          handleSeasonChange(Number(e.target.value))
                        }
                        className="appearance-none bg-zinc-800/90 text-white text-sm font-semibold py-2 pl-4 pr-10 rounded border border-zinc-700/70 focus:outline-none focus:border-[#0077FD] cursor-pointer transition-all"
                      >
                        {data.seasons.map((s) => {
                          const seasonName = s.title?.trim() || s.name?.trim();
                          return (
                            <option key={s.id} value={s.number}>
                              {seasonName
                                ? t("seasonOptionWithName", {
                                    name: seasonName,
                                    count: s.episodes.length,
                                  })
                                : t("seasonOption", {
                                    number: s.number,
                                    count: s.episodes.length,
                                  })}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                      />
                    </div>
                  )}
                </div>

                {/* Lista de Episódios em Linha (Rows) */}
                <div className="flex flex-col">
                  {episodesList.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic py-4">
                      {t("noEpisodes")}
                    </p>
                  ) : (
                    <>
                      {episodesList.slice(0, visibleCount).map((ep) => {
                        const isNextTarget = targetEpisode?.id === ep.id;

                        return (
                          <Link
                            key={ep.id}
                            href={
                              ep.href ||
                              `/watch/${ep.publicId || ep.id}/${ep.slug || `episode-${ep.number}`}`
                            }
                            onClick={onClose}
                            className={`group flex flex-col sm:flex-row gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-colors ${
                              isNextTarget ? "bg-[#151515]" : "hover:bg-[#151515]"
                            }`}
                          >
                            {/* Thumb do Episódio */}
                            <div className="relative aspect-16/9 w-full sm:w-44 overflow-hidden rounded-lg bg-zinc-950 flex-shrink-0">
                              {isNextTarget ? (
                                <div className="absolute top-1.5 left-1.5 z-10">
                                  <span className="px-2 py-0.5 text-[11px] font-bold text-blue-400 bg-blue-950/80 backdrop-blur-sm rounded border border-blue-500/40 whitespace-nowrap shadow-md">
                                    {t("next")}
                                  </span>
                                </div>
                              ) : (
                                data.rating && (
                                  <div className="absolute top-1.5 left-1.5 z-10 drop-shadow-md">
                                    <RatingBadge rating={data.rating} size={18} />
                                  </div>
                                )
                              )}

                              {ep.imageUrl ? (
                                <Image
                                  src={ep.imageUrl}
                                  alt={ep.title || t("episodeNumber", { number: ep.number })}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 176px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                                  Ep {ep.number}
                                </div>
                              )}

                              {/* Badge de Duração na Thumbnail (Estilo EpisodeSidebar) */}
                              {formatDuration(data?.duration) && (
                                <div className="absolute rounded bottom-1 right-1 bg-[#0009] px-1 py-0.5 text-xs font-bold text-white backdrop-blur-sm z-10">
                                  {formatDuration(data?.duration)}
                                </div>
                              )}

                              {/* Ícone de Play Hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                <div className="p-2.5 rounded-full bg-[#0077FD] text-white shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Play size={18} className="fill-white" />
                                </div>
                              </div>
                            </div>

                            {/* Infos do Episódio */}
                            <div className="flex flex-col justify-center min-w-0 flex-1 gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-[#0077FD] transition-colors line-clamp-1">
                                  {ep.number}.{" "}
                                  {ep.title || t("episodeNumber", { number: ep.number })}
                                </h4>
                              </div>

                              {(data.isDubbed || data.isSubtitled) && (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                                  {data.isDubbed && data.isSubtitled ? (
                                    <span>{t("subDub")}</span>
                                  ) : data.isDubbed ? (
                                    <span>{t("dubbed")}</span>
                                  ) : (
                                    <span>{t("subtitled")}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}

                      {/* Botão para carregar mais 12 episódios */}
                      {visibleCount < episodesList.length && (
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                          className="mt-2 w-full py-3 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white text-sm font-bold border border-zinc-700/60 transition-all active:scale-[0.99]"
                        >
                          {t("loadMoreEpisodes", {
                            remaining: episodesList.length - visibleCount,
                          })}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

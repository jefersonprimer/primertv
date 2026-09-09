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
  Clock,
  Sparkles,
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

interface QuickViewModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ slug, isOpen, onClose }: QuickViewModalProps) {
  const t = useTranslations("QuickViewModal");
  const [data, setData] = useState<AnimeQuickPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [mounted, setMounted] = useState(false);

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

    getAnimeQuickPreview(slug)
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
  }, [isOpen, slug]);

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
  const watchUrl = targetEpisode
    ? `/watch/${targetEpisode.publicId}/${targetEpisode.slug}`
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-[#0d0d0f] text-zinc-100 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 z-10 flex flex-col max-h-[92vh]">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-300 hover:text-white hover:bg-zinc-800/90 transition-all duration-200 border border-white/15 shadow-lg backdrop-blur-md hover:scale-105 active:scale-95"
          aria-label={t("close")}
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="overflow-y-auto custom-scrollbar flex flex-col animate-pulse">
            {/* Banner Skeleton */}
            <div className="relative aspect-16/9 w-full max-h-[360px] sm:max-h-[440px] md:max-h-[480px] bg-zinc-900/80 flex-shrink-0 flex items-end p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="h-11 w-40 bg-zinc-800/80 rounded-xl" />
                <div className="h-10 w-10 bg-zinc-800/80 rounded-full" />
                <div className="h-10 w-10 bg-zinc-800/80 rounded-full" />
                <div className="h-10 w-10 bg-zinc-800/80 rounded-full" />
                <div className="h-10 w-10 bg-zinc-800/80 rounded-full ml-auto" />
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-5 sm:p-7 flex flex-col gap-6">
              {/* Title & Badges Skeleton */}
              <div className="flex flex-col gap-3">
                <div className="h-8 w-2/3 bg-zinc-800/70 rounded-lg" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-14 bg-zinc-800/70 rounded-md" />
                  <div className="h-6 w-16 bg-zinc-800/70 rounded-md" />
                  <div className="h-6 w-20 bg-zinc-800/70 rounded-md" />
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="flex flex-col gap-2.5">
                <div className="h-4 w-full bg-zinc-800/60 rounded" />
                <div className="h-4 w-5/6 bg-zinc-800/60 rounded" />
                <div className="h-4 w-4/6 bg-zinc-800/60 rounded" />
              </div>

              {/* Episodes Section Skeleton */}
              <div className="flex flex-col gap-4 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-28 bg-zinc-800/70 rounded-md" />
                  <div className="h-9 w-40 bg-zinc-800/70 rounded-xl" />
                </div>

                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 rounded-xl bg-zinc-900/40 border border-white/5"
                    >
                      <div className="aspect-16/9 w-full sm:w-44 bg-zinc-800/60 rounded-lg flex-shrink-0" />
                      <div className="flex flex-col justify-center flex-1 gap-2">
                        <div className="h-5 w-3/4 bg-zinc-800/60 rounded" />
                        <div className="h-4 w-1/4 bg-zinc-800/40 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <p className="text-zinc-400 font-medium">
              {t("failedToLoad")}
            </p>
            <Link
              href={`/animes/${slug}`}
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#0077FD] hover:bg-[#0066D6] text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
            >
              {t("moreDetails")}
            </Link>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex flex-col">
            {/* Banner Header */}
            <div className="relative aspect-16/9 w-full max-h-[360px] sm:max-h-[440px] md:max-h-[480px] overflow-hidden bg-zinc-950 flex-shrink-0">
              {headerBanner ? (
                <Image
                  src={headerBanner}
                  alt={targetEpisode?.title || data.title}
                  fill
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-zinc-500 font-bold text-lg">
                  {data.title}
                </div>
              )}

              {/* Soft Multi-layered Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f]/90 via-[#0d0d0f]/30 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

              {/* Conteúdo Inferior no Banner (Logo/Nome + Botões) */}
              <div className="absolute bottom-5 left-5 right-5 sm:left-7 sm:right-7 z-10 flex flex-col gap-3.5 sm:gap-4">
                {/* Logo ou Nome do Anime */}
                <Link
                  href={`/animes/${data.slug}`}
                  onClick={onClose}
                  className="block max-w-[80%] sm:max-w-[60%] hover:opacity-90 transition-opacity group cursor-pointer"
                >
                  {data.logoUrl ? (
                    <div className="relative aspect-[3/1] w-full max-w-[180px] sm:max-w-[260px] md:max-w-[300px] drop-shadow-xl">
                      <Image
                        src={data.logoUrl}
                        alt={data.title}
                        fill
                        priority
                        className="object-contain object-left"
                      />
                    </div>
                  ) : (
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-lg line-clamp-2 group-hover:text-blue-400 transition-colors tracking-tight">
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

                  <div className="flex items-center gap-2 bg-zinc-900/60 backdrop-blur-md p-1 rounded-full border border-white/10">
                    <WatchlistButton
                      mediaType="ANIME"
                      mediaId={data.id}
                      slug={data.slug}
                      initialInWatchlist={data.inWatchlist}
                      isLoggedIn={data.isLoggedIn}
                      size={20}
                    />

                    <AddToListButton
                      animeId={data.id}
                      isLoggedIn={data.isLoggedIn}
                      size={20}
                    />

                    <ShareButton
                      url={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/animes/${data.slug}`
                          : undefined
                      }
                      size={20}
                    />
                  </div>

                  <Link
                    href={`/animes/${data.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-2 p-2.5 rounded-full bg-zinc-900/70 hover:bg-zinc-800 text-white/90 hover:text-white border border-white/10 hover:border-white/25 backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ml-auto shadow-md"
                    title={t("moreDetails")}
                  >
                    <Info size={20} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Conteúdo com Informações Detalhadas */}
            <div className="p-5 sm:p-7 flex flex-col gap-6">
              {/* Título & Badges */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  {data.score && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 px-2.5 py-1 bg-amber-500/10 rounded-md border border-amber-500/20 shadow-sm">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      <span>{data.score.toFixed(1)}</span>
                    </div>
                  )}

                  {data.rating && (
                    <RatingBadge rating={data.rating} size={22} />
                  )}

                  {data.year && (
                    <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 font-medium text-xs border border-white/5">
                      {data.year}
                    </span>
                  )}

                  {data.seasons && data.seasons.length > 0 && (
                    <span className="px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 font-medium text-xs border border-white/5">
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
                  className="text-zinc-300/90 text-sm sm:text-base leading-relaxed"
                />
              )}

              {/* Seção de Episódios & Dropdown de Temporadas */}
              <div className="flex flex-col gap-4 border-t border-white/10 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    <span>{t("episodes")}</span>
                  </h3>

                  {/* Dropdown de Temporadas */}
                  {data.seasons && data.seasons.length > 0 && (
                    <div className="relative inline-block">
                      <select
                        value={selectedSeasonNumber}
                        onChange={(e) =>
                          handleSeasonChange(Number(e.target.value))
                        }
                        className="appearance-none bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 text-xs sm:text-sm font-semibold py-2 pl-3.5 pr-9 rounded-xl border border-white/10 focus:outline-none focus:border-[#0077FD] cursor-pointer transition-all shadow-sm"
                      >
                        {data.seasons.map((s) => (
                          <option key={s.id} value={s.number} className="bg-zinc-900 text-zinc-100">
                            {t("seasonOption", {
                              number: s.number,
                              count: s.episodes.length,
                            })}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                      />
                    </div>
                  )}
                </div>

                {/* Lista de Episódios em Linha (Rows) */}
                <div className="flex flex-col gap-3">
                  {episodesList.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic py-6 text-center">
                      {t("noEpisodes")}
                    </p>
                  ) : (
                    <>
                      {episodesList.slice(0, visibleCount).map((ep) => {
                        const isNextTarget = targetEpisode?.id === ep.id;

                        return (
                          <Link
                            key={ep.id}
                            href={`/watch/${ep.publicId || ep.id}/${ep.slug || `episode-${ep.number}`}`}
                            onClick={onClose}
                            className={`group flex flex-col sm:flex-row gap-3.5 sm:gap-4 p-3 rounded-xl transition-all duration-200 border ${
                              isNextTarget
                                ? "bg-blue-950/20 border-blue-500/40 hover:bg-blue-900/30 hover:border-blue-500/60 shadow-lg shadow-blue-950/30"
                                : "bg-zinc-900/40 border-white/[0.06] hover:bg-zinc-800/60 hover:border-white/15 shadow-sm"
                            }`}
                          >
                            {/* Thumb do Episódio */}
                            <div className="relative aspect-16/9 w-full sm:w-44 overflow-hidden rounded-lg bg-zinc-950 flex-shrink-0 border border-white/5">
                              {ep.imageUrl ? (
                                <Image
                                  src={ep.imageUrl}
                                  alt={ep.title || t("episodeNumber", { number: ep.number })}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 176px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500 bg-zinc-900">
                                  Ep {ep.number}
                                </div>
                              )}

                              {/* Badge de Duração na Thumbnail */}
                              {formatDuration(data?.duration) && (
                                <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-200 backdrop-blur-md z-10 border border-white/10 flex items-center gap-1">
                                  <Clock size={10} className="text-zinc-400" />
                                  <span>{formatDuration(data?.duration)}</span>
                                </div>
                              )}

                              {/* Ícone de Play Hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-[2px]">
                                <div className="p-3 rounded-full bg-[#0077FD] text-white shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform">
                                  <Play size={18} className="fill-white translate-x-0.5" />
                                </div>
                              </div>
                            </div>

                            {/* Infos do Episódio */}
                            <div className="flex flex-col justify-center min-w-0 flex-1 gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                                  {ep.number}.{" "}
                                  {ep.title || t("episodeNumber", { number: ep.number })}
                                </h4>

                                {isNextTarget && (
                                  <span className="px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 rounded-full border border-blue-500/30 whitespace-nowrap shadow-sm">
                                    {t("next")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Botão para carregar mais episódios */}
                      {visibleCount < episodesList.length && (
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                          className="mt-2 w-full py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/90 text-zinc-300 hover:text-white text-sm font-semibold border border-white/10 hover:border-white/20 transition-all duration-200 shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
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

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
  Loader2,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { WatchlistButton } from "./WatchlistButton";
import ShareButton from "./ShareButton";
import AddToListButton from "./AddToListButton";
import RatingBadge from "./RatingBadge";
import {
  getAnimeQuickPreview,
  type AnimeQuickPreviewData,
  type EpisodePreviewItem,
} from "@/app/actions/getAnimeQuickPreview";

interface QuickViewModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ slug, isOpen, onClose }: QuickViewModalProps) {
  const t = useTranslations("QuickViewModal");
  const tSeason = useTranslations("SeasonSelector");
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

  const buttonText = data?.hasHistory
    ? t("continueWatching", { number: targetEpisode?.number ?? 1 })
    : targetEpisode?.number
      ? t("watchEpisode", { number: targetEpisode.number })
      : t("startWatching");

  const currentSeason = data?.seasons?.find(
    (s) => s.number === selectedSeasonNumber,
  );
  const episodesList = currentSeason?.episodes || [];

  const formatDate = (dateInput?: Date | string) => {
    if (!dateInput) return null;
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl bg-[#141414] text-[#f2f2f2] shadow-2xl border border-zinc-800/80 z-10 flex flex-col max-h-[92vh]">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all border border-white/10"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-zinc-400">
            <Loader2 className="animate-spin text-[#0077FD]" size={36} />
            <p className="text-sm font-medium">{t("loading")}</p>
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <p className="text-zinc-400">
              Não foi possível carregar os detalhes rápidos.
            </p>
            <Link
              href={`/animes/${slug}`}
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-[#0077FD] hover:bg-[#0066D6] text-white text-sm font-bold transition-all"
            >
              {t("moreDetails")}
            </Link>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex flex-col">
            {/* Banner Header */}
            <div className="relative aspect-16/9 w-full max-h-[280px] sm:max-h-[320px] overflow-hidden bg-zinc-900 flex-shrink-0">
              {data.bannerUrl || data.imageUrl ? (
                <Image
                  src={data.bannerUrl || data.imageUrl!}
                  alt={data.title}
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

              {/* Botões Principais no Banner */}
              <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-wrap items-center gap-3">
                <Link
                  href={watchUrl}
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0077FD] hover:bg-[#0066D6] text-white text-sm sm:text-base font-bold shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Play size={20} className="fill-white" />
                  <span>{buttonText}</span>
                </Link>

                <WatchlistButton
                  mediaType="ANIME"
                  mediaId={data.id}
                  slug={data.slug}
                  initialInWatchlist={data.inWatchlist}
                  isLoggedIn={data.isLoggedIn}
                  size={24}
                />

                <AddToListButton
                  animeId={data.id}
                  isLoggedIn={data.isLoggedIn}
                  size={24}
                />

                <ShareButton
                  url={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/animes/${data.slug}`
                      : undefined
                  }
                  size={24}
                />

                <Link
                  href={`/animes/${data.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-2 p-2 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-white text-sm font-semibold border border-zinc-700/60 hover:border-zinc-500 transition-all ml-auto"
                >
                  <Info size={24} />
                </Link>
              </div>
            </div>

            {/* Conteúdo com Informações Detalhadas */}
            <div className="p-4 sm:p-6 flex flex-col gap-6">
              {/* Título & Badges */}
              <div className="flex flex-col gap-2">
                <Link
                  href={`/animes/${data.slug}`}
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white hover:underline tracking-tight"
                >
                  {data.title}
                </Link>

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

                  {(data.isDubbed || data.isSubtitled) && (
                    <span className="flex items-center justify-center gap-1 text-sm font-medium text-[#bbb] px-1 py-0.5 bg-zinc-800/60 rounded-md border border-zinc-700/40">
                      {data.isDubbed && data.isSubtitled
                        ? t("subDub")
                        : data.isDubbed
                          ? t("dubbed")
                          : t("subtitled")}
                    </span>
                  )}

                  {/* Gêneros */}
                  {data.genres && data.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {data.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2.5 py-1 text-xs font-medium text-zinc-400 bg-zinc-800/60 rounded-full border border-zinc-700/40"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sinopse */}
              {data.description && (
                <p className="text-sm sm:text-base text-zinc-300/90 leading-relaxed line-clamp-3">
                  {data.description}
                </p>
              )}

              {/* Seção de Episódios & Dropdown de Temporadas */}
              <div className="flex flex-col gap-4 border-t border-zinc-800/80 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Episódios
                  </h3>

                  {/* Dropdown de Temporadas */}
                  {data.seasons && data.seasons.length > 0 && (
                    <div className="relative inline-block">
                      <select
                        value={selectedSeasonNumber}
                        onChange={(e) =>
                          handleSeasonChange(Number(e.target.value))
                        }
                        className="appearance-none bg-zinc-800/90 text-white text-sm font-semibold py-2 pl-4 pr-10 rounded-xl border border-zinc-700/70 focus:outline-none focus:border-[#0077FD] cursor-pointer transition-all"
                      >
                        {data.seasons.map((s) => (
                          <option key={s.id} value={s.number}>
                            Temporada {s.number} ({s.episodes.length} eps)
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
                    <p className="text-sm text-zinc-500 italic py-4">
                      Nenhum episódio cadastrado nesta temporada.
                    </p>
                  ) : (
                    <>
                      {episodesList.slice(0, visibleCount).map((ep) => {
                        const isNextTarget = targetEpisode?.id === ep.id;
                        const formattedDate = formatDate(ep.createdAt);

                        return (
                          <Link
                            key={ep.id}
                            href={`/watch/${ep.publicId || ep.id}/${ep.slug || `episode-${ep.number}`}`}
                            onClick={onClose}
                            className={`group flex flex-col sm:flex-row gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl transition-all border ${
                              isNextTarget
                                ? "bg-blue-950/30 border-blue-600/50 hover:bg-blue-900/40"
                                : "bg-zinc-900/60 border-zinc-800/70 hover:bg-zinc-800/80 hover:border-zinc-700"
                            }`}
                          >
                            {/* Thumb do Episódio */}
                            <div className="relative aspect-16/9 w-full sm:w-44 overflow-hidden rounded-lg bg-zinc-950 flex-shrink-0">
                              {ep.imageUrl ? (
                                <Image
                                  src={ep.imageUrl}
                                  alt={ep.title || `Episódio ${ep.number}`}
                                  fill
                                  sizes="(max-width: 640px) 100vw, 176px"
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">
                                  Ep {ep.number}
                                </div>
                              )}

                              {/* Ícone de Play Hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
                                  {ep.title || `Episódio ${ep.number}`}
                                </h4>

                                {isNextTarget && (
                                  <span className="px-2 py-0.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 rounded border border-blue-500/20 whitespace-nowrap">
                                    Próximo
                                  </span>
                                )}
                              </div>

                              {formattedDate && (
                                <div className="flex items-center gap-1 text-xs text-zinc-400">
                                  <Calendar size={12} />
                                  <span>{formattedDate}</span>
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
                          Carregar mais episódios (
                          {episodesList.length - visibleCount} restantes)
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

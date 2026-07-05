"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Star, Play, Loader2 } from "lucide-react";
import {
  getAnimePreview,
  type AnimePreviewData,
} from "@/app/actions/animePreview";
import RatingBadge from "./RatingBadge";
import { WatchlistButton } from "./WatchlistButton";
import AddToListButton from "./AddToListButton";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";

interface MediaCardPreviewProps {
  animeId: string;
  triggerRect: DOMRect | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export default function MediaCardPreview({
  animeId,
  triggerRect,
  onMouseEnter,
  onMouseLeave,
}: MediaCardPreviewProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    position: "left" | "right";
  } | null>(null);
  const [data, setData] = useState<AnimePreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const locale = useLocale();
  const isPt = locale.startsWith("pt");

  // Format members count nicely
  function formatMembers(num: number | null | undefined): string {
    if (num === null || num === undefined) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }
    return num.toString();
  }

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch anime preview details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getAnimePreview(animeId).then((res) => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [animeId]);

  // Compute position relative to the triggering MediaCard
  useEffect(() => {
    if (!triggerRect || !mounted) return;

    const modalWidth = 300; // Width of the popover card
    const spacing = 12; // Space between card and popover
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Decide if we position on the right or left
    let position: "left" | "right" = "right";
    let left = triggerRect.right + window.scrollX + spacing;

    // If it overflows the right edge, place it on the left
    if (triggerRect.right + modalWidth + spacing > viewportWidth) {
      position = "left";
      left = triggerRect.left + window.scrollX - modalWidth - spacing;
    }

    // Default top aligns with the top of the card
    let top = triggerRect.top + window.scrollY;

    // Clamp the top position so it doesn't go below the viewport bottom
    const modalHeight = 240; // Estimated height of the popover
    if (triggerRect.top + modalHeight > viewportHeight) {
      top = Math.max(
        8 + window.scrollY,
        triggerRect.bottom + window.scrollY - modalHeight,
      );
    }

    setCoords({ top, left, position });
  }, [triggerRect, mounted]);

  if (!mounted || !coords) return null;

  const seasonsText = data
    ? isPt
      ? data.seasonCount === 1
        ? "Temporada 1"
        : `${data.seasonCount} Temporadas`
      : data.seasonCount === 1
        ? "Season 1"
        : `${data.seasonCount} Seasons`
    : "";

  const episodesText = data
    ? isPt
      ? data.episodeCount === 1
        ? "Episódio 1"
        : `${data.episodeCount} Episódios`
      : data.episodeCount === 1
        ? "Episode 1"
        : `${data.episodeCount} Episodes`
    : "";

  const membersLabel = isPt ? "membros" : "members";
  const loadingLabel = isPt ? "Carregando..." : "Loading...";
  const errorLabel = isPt
    ? "Falha ao carregar prévia"
    : "Failed to load preview";

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="z-50 w-[300px] rounded-xl border border-zinc-800 bg-zinc-950/98 backdrop-blur-md p-4 text-zinc-100 shadow-2xl transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
    >
      {loading ? (
        <div className="flex h-[150px] items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
          <span className="text-sm font-medium">{loadingLabel}</span>
        </div>
      ) : !data ? (
        <div className="flex h-[100px] items-center justify-center text-sm text-zinc-500">
          {errorLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Title */}
          <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">
            {data.title}
          </h4>

          {/* Rating, Score, Members */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {data.rating && (
              <div className="flex-shrink-0 scale-90 origin-left">
                <RatingBadge rating={data.rating} size={20} />
              </div>
            )}
            {data.score !== null && (
              <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                <Star size={14} className="fill-current text-yellow-500" />
                {data.score.toFixed(1)}
              </span>
            )}
            {data.members !== null && (
              <span className="text-zinc-400 font-medium">
                {formatMembers(data.members)} {membersLabel}
              </span>
            )}
          </div>

          {/* Seasons & Episodes */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <span>{seasonsText}</span>
            <span className="text-zinc-600">•</span>
            <span>{episodesText}</span>
          </div>

          {/* Description */}
          {data.description ? (
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-6">
              {data.description}
            </p>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              {isPt ? "Sem descrição disponível." : "No description available."}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-1 pt-3 border-t border-zinc-900">
            {data.firstEpisode ? (
              <Link
                href={`/watch/${data.firstEpisode.publicId}/${data.firstEpisode.slug || `episode-${data.firstEpisode.number}`}`}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors flex items-center justify-center shadow-md cursor-pointer group"
                title={isPt ? "Assistir Episódio 1" : "Watch Episode 1"}
              >
                <Play size={14} className="fill-black text-black ml-0.5" />
              </Link>
            ) : (
              <Link
                href={`/animes/${data.slug}`}
                className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center justify-center shadow-md cursor-pointer group"
                title={isPt ? "Ver detalhes" : "View details"}
              >
                <Play size={14} className="fill-current text-zinc-300 ml-0.5" />
              </Link>
            )}

            {/* Add to Watchlist */}
            <WatchlistButton
              mediaType="ANIME"
              mediaId={data.id}
              slug={data.slug}
              initialInWatchlist={data.inWatchlist}
              isLoggedIn={data.isLoggedIn}
              compact={true}
              roundedFull={true}
              hasBorder={false}
            />

            {/* Add to Custom List */}
            <AddToListButton
              animeId={data.id}
              isLoggedIn={data.isLoggedIn}
              compact={true}
              roundedFull={true}
              hasBorder={false}
            />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

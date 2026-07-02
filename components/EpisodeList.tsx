"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon } from "lucide-react";
import RatingBadge from "./RatingBadge";

interface Item {
  id: string;
  number: number;
  title: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  animeTitle?: string | null;
  animeRating?: string | null;
  animeDuration?: string | null;
  href?: string;
}

interface EpisodeListProps {
  items: Item[];
  baseUrl?: string;
  label?: string; // "Episódio" or "Capítulo"
  itemType: "episode" | "chapter";
  animeTitle?: string | null;
  animeRating?: string | null;
  animeDuration?: string | null;
}

function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "";
  const matches = duration.match(/\d+/);
  if (matches) {
    return `${matches[0]}m`;
  }
  return duration;
}

export default function EpisodeList({
  items,
  baseUrl,
  label = "Episódio",
  itemType,
  animeTitle,
  animeRating,
  animeDuration,
}: EpisodeListProps) {
  const [visibleCount, setVisibleCount] = useState(12);

  const showMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item) => {
          const displayAnimeTitle = item.animeTitle || animeTitle;
          const displayAnimeRating = item.animeRating || animeRating;
          const displayAnimeDuration = item.animeDuration || animeDuration;

          return (
            <Link
              key={item.id}
              href={item.href || (baseUrl ? `${baseUrl}/${item.id}` : "#")}
              className={`group relative flex gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-all duration-300 overflow-hidden ${
                itemType === "episode" ? "flex-row sm:flex-col" : "flex-col"
              }`}
            >
              {itemType === "episode" && (
                <div className="relative aspect-video w-38 sm:w-full flex-shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title || `${label} ${item.number}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-xs text-zinc-500">
                      Sem imagem
                    </div>
                  )}

                  {/* Rating badge on top-left */}
                  {displayAnimeRating && (
                    <div className="absolute top-1 left-1 z-10">
                      <RatingBadge rating={displayAnimeRating} size={16} />
                    </div>
                  )}

                  {/* Duration badge on bottom-right */}
                  {displayAnimeDuration && (
                    <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 text-sm font-bold text-white backdrop-blur-sm">
                      {formatDuration(displayAnimeDuration)}
                    </div>
                  )}
                </div>
              )}

              {/* Text under the image */}
              {itemType === "episode" ? (
                <div className="flex flex-col gap-1 flex-1 justify-center sm:justify-start">
                  {displayAnimeTitle && (
                    <span className="text-[10px] font-normal sm:font-bold text-[#8c8c8c] uppercase tracking-wider line-clamp-1">
                      {displayAnimeTitle}
                    </span>
                  )}
                  <h3 className="line-clamp-2 sm:line-clamp-1 text-sm sm:text-base font-bold text-white">
                    {item.title && item.title.trim()
                      ? item.title
                      : `${label} ${item.number}`}
                  </h3>
                </div>
              ) : (
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-500">
                      {label} {item.number}
                    </span>
                    {itemType === "chapter" && item.videoUrl && (
                      <span className="bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        HD
                      </span>
                    )}
                  </div>
                  <h4 className="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-100">
                    {item.title || `${label} ${item.number}`}
                  </h4>
                </div>
              )}

              {/* Bottom card button (only shown for chapters) */}
              {itemType === "chapter" && (
                <div className="mt-auto pt-2">
                  <div className="w-full inline-flex items-center justify-center bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-700 md:opacity-0 group-hover:opacity-100 transform md:translate-y-1 group-hover:translate-y-0">
                    Ler Agora
                  </div>
                </div>
              )}

              {/* Hover overlay covering the whole card container */}
              {itemType === "episode" && item.videoUrl && (
                <div className="hidden sm:flex absolute inset-0 bg-zinc-900 dark:bg-zinc-950 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex-col p-4 justify-between text-white z-20 pointer-events-none group-hover:pointer-events-auto">
                  <div className="flex flex-col gap-1">
                    {displayAnimeTitle && (
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider line-clamp-1">
                        {displayAnimeTitle}
                      </span>
                    )}
                    <h4 className="line-clamp-2 text-base font-normal text-white">
                      {item.title || `${label} ${item.number}`}
                    </h4>
                  </div>

                  <div className="w-full inline-flex items-center justify-center bg-blue-600 gap-2 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 mt-auto uppercase">
                    <PlayIcon size={20} />
                    {label === "Filme"
                      ? "assistir filme"
                      : `reproduzir ep ${item.number}`}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div className="w-full max-w-[1018px] mx-auto">
          <button
            onClick={showMore}
            className="bg-zinc-900 w-full py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700 uppercase"
          >
            mostrar mais
          </button>
        </div>
      )}
    </div>
  );
}

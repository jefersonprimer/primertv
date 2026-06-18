"use client";

import { useState } from "react";
import Link from "next/link";

interface Item {
  id: string;
  number: number;
  title: string | null;
  videoUrl?: string | null;
}

interface EpisodeListProps {
  items: Item[];
  baseUrl: string;
  label?: string; // "Episódio" or "Capítulo"
  itemType: "episode" | "chapter";
}

export default function EpisodeList({
  items,
  baseUrl,
  label = "Episódio",
  itemType,
}: EpisodeListProps) {
  const [visibleCount, setVisibleCount] = useState(12);

  const showMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-500">
                {label} {item.number}
              </span>
              {itemType === "episode" && item.videoUrl && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  HD
                </span>
              )}
            </div>
            <h4 className="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-100">
              {item.title || `${label} ${item.number}`}
            </h4>
            {(itemType === "chapter" || item.videoUrl) && (
              <Link
                href={`${baseUrl}/${item.id}`}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {itemType === "episode" ? "Assistir Agora" : "Ler Agora"}
              </Link>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 w-full max-w-[1018px] mx-auto">
          <button
            onClick={showMore}
            className="bg-zinc-900 w-full py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Mostrar Mais
          </button>
        </div>
      )}
    </div>
  );
}

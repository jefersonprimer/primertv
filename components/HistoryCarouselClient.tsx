"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HistoryItem {
  id: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string | null;
  episodeImageUrl: string | null;
  seasonNumber: number;
  animeId: string;
  animeSlug: string;
  animeTitle: string;
  animeImageUrl: string | null;
  watchedAt: Date;
}

interface HistoryCarouselClientProps {
  items: HistoryItem[];
}

export function HistoryCarouselClient({ items }: HistoryCarouselClientProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 40);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const isLargeScreen = window.innerWidth >= 1024;
      let scrollAmount;

      if (isLargeScreen) {
        // Scroll 4 cards on desktop: (287.75px width + 24px gap) * 4 = 1247px
        scrollAmount = direction === "left" ? -1247 : 1247;
      } else {
        const { clientWidth } = scrollRef.current;
        scrollAmount = direction === "left" ? -clientWidth : clientWidth;
      }

      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="group/carousel relative">
      <div
        className="mb-6 flex items-end justify-between w-full"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            Continuar Assistindo
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            De onde você parou
          </p>
        </div>
        <Link
          href="/historico"
          className="text-sm font-medium text-blue-500 hover:underline"
        >
          Ver histórico
        </Link>
      </div>

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 z-10 flex h-full w-12 items-center justify-center bg-gradient-to-r from-white via-white/80 to-transparent text-zinc-900 opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 dark:from-zinc-950 dark:via-zinc-950/80 dark:text-zinc-50"
            aria-label="Scroll left"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 no-scrollbar"
          style={{
            paddingLeft: "max(8px, (100vw - 1223px) / 2)",
            paddingRight: "max(8px, (100vw - 1223px) / 2)",
          }}
        >
          {items.map((item) => {
            const cardHref = `/animes/${item.animeSlug}/episode/${item.episodeId}`;
            const displayImageUrl = item.episodeImageUrl || item.animeImageUrl;

            return (
              <div
                key={item.id}
                className="w-[260px] flex-shrink-0 sm:w-[300px] lg:w-[287.75px] hover:bg-zinc-800 p-2"
              >
                <div className="group flex flex-col gap-2">
                  <Link
                    href={cardHref}
                    className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10"
                  >
                    {/* Main Image */}
                    {displayImageUrl ? (
                      <Image
                        src={displayImageUrl}
                        alt={`Episódio ${item.episodeNumber} de ${item.animeTitle}`}
                        fill
                        sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 287.75px"
                        className="object-cover transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400 text-sm font-medium">
                        {item.animeTitle}
                      </div>
                    )}

                    {/* Season / Episode overlay badge */}
                    <div className="absolute top-2 left-2 z-20 bg-black/75 backdrop-blur-xs text-white px-2 py-0.5 text-xs font-semibold">
                      T{item.seasonNumber} : EP {item.episodeNumber}
                    </div>

                    {/* Hover Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 scale-90 group-hover:scale-100">
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      </div>
                    </div>
                  </Link>

                  <div className="flex flex-col gap-0.5 px-1">
                    <Link href={cardHref}>
                      <h3 className="line-clamp-2 text-base font-semibold text-zinc-800 dark:text-zinc-200 hover:text-blue-500 transition-colors">
                        {item.animeTitle}
                      </h3>
                    </Link>
                    <Link
                      href={cardHref}
                      className="text-sm text-zinc-500 dark:text-zinc-400 font-medium hover:text-blue-500 transition-colors flex items-center gap-1"
                    >
                      Continuar a assistir EP{item.episodeNumber}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 z-10 flex h-full w-12 items-center justify-center bg-gradient-to-l from-white via-white/80 to-transparent text-zinc-900 opacity-0 transition-opacity duration-300 group-hover/carousel:opacity-100 dark:from-zinc-950 dark:via-zinc-950/80 dark:text-zinc-50"
            aria-label="Scroll right"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>
    </section>
  );
}

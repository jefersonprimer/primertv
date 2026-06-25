"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { HistoryCard, type HistoryItem } from "./HistoryCard";

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
        className="mb-3 sm:mb-4 flex items-end justify-between w-full"
        style={{
          paddingLeft: "max(8px, (100vw - 1223px) / 2)",
          paddingRight: "max(8px, (100vw - 1223px) / 2)",
        }}
      >
        <h2 className="text-[22px] md:text-[28px] font-bold text-[#f2f2f2]  flex items-center gap-2">
          Continuar Assistindo
        </h2>
        <Link
          href="/historico"
          className="flex items-center gap-1.5 text-sm font-bold text-[#bbb] hover:text-white hover:underline uppercase"
        >
          <span>Ver histórico</span>
          <ChevronRight size={20} />
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
          {items.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
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

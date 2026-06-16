"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "./MediaCard";
import Link from "next/link";

interface MediaCarouselProps {
  title: string;
  subtitle?: string;
  items: any[];
  type: "anime" | "series" | "movie" | "manga" | "novela" | "channel";
  viewAllHref?: string;
  priority?: boolean;
}

export function MediaCarousel({
  title,
  subtitle,
  items,
  type,
  viewAllHref,
  priority = false,
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === "left" ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="group/carousel relative">
      <div className="mb-6 flex items-end justify-between px-2 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-blue-500 hover:underline"
          >
            Ver tudo
          </Link>
        )}
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
          className="flex gap-6 overflow-x-auto scroll-smooth px-2 lg:px-8 pb-4 no-scrollbar"
        >
          {items.map((item, index) => (
            <div key={item.id} className="w-[160px] flex-shrink-0 sm:w-[200px]">
              <MediaCard
                item={item}
                type={type}
                priority={priority && index < 4}
              />
            </div>
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

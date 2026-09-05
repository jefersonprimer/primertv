"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TrendingNowCard, type TrendingNowCardItem } from "./TrendingNowCard";

interface TrendingNowCarouselProps {
  title?: string;
  subtitle?: string;
  items: TrendingNowCardItem[];
}

export function TrendingNowCarousel({
  title,
  subtitle,
  items,
}: TrendingNowCarouselProps) {
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
      const { clientWidth } = scrollRef.current;
      const scrollAmount =
        direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="group/carousel relative">
      {title && (
        <div
          className="mb-3 sm:mb-4 flex items-end justify-between w-full"
          style={{
            paddingLeft: "max(8px, (100vw - 1240px) / 2)",
            paddingRight: "max(8px, (100vw - 1240px) / 2)",
          }}
        >
          <div>
            <h2 className="text-[22px] md:text-[28px] font-bold text-[#f2f2f2] px-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm md:text-base font-normal text-[#bbb]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 z-10 flex h-full items-center text-zinc-200 hover:text-white transition-colors"
            aria-label="Scroll left"
          >
            <div className="bg-[#303030] px-0.5 py-12 flex items-center justify-center rounded-r-xl">
              <ChevronLeft size={32} />
            </div>
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto scroll-smooth pb-6 pt-2 no-scrollbar"
          style={{
            paddingLeft: "max(2px, (100vw - 1240px) / 2)",
            paddingRight: "max(2px, (100vw - 1240px) / 2)",
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="w-[180px] flex-shrink-0 sm:w-[160px] md:w-[140px] lg:w-[180px] xl:w-[225.4px]"
            >
              <TrendingNowCard item={item} rank={index + 1} />
            </div>
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 z-10 flex h-full items-center text-zinc-200 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <div className="bg-[#303030] px-0.5 py-12 flex items-center justify-center rounded-l-xl">
              <ChevronRight size={32} />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";

export type TrendingNowCardItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
};

interface TrendingNowCardProps {
  item: TrendingNowCardItem;
  rank: number;
}

export function TrendingNowCard({ item, rank }: TrendingNowCardProps) {
  return (
    <Link
      href={`/series/${item.slug}`}
      className="relative block pl-6 sm:pl-10 select-none group"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-2/3 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 transition-all duration-300 group-hover:scale-[1.03] group-hover:border-zinc-500 shadow-lg">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 120px, (max-width: 1024px) 180px, 220px"
            className="object-cover"
            priority={rank <= 3}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500 text-xs text-center p-3 bg-zinc-950">
            {item.title}
          </div>
        )}
      </div>

      {/* The giant number placed at the bottom-left, overlapping the image */}
      <span className="absolute left-4 md:left-6 bottom-[14px] md:bottom-[10px] z-10 text-[60px] md:text-[80px] lg:text-[100px] font-black leading-none stroke-text select-none font-sans transition-transform duration-300 group-hover:scale-105">
        {rank}
      </span>
    </Link>
  );
}

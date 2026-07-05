"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import MediaCardPreview from "./MediaCardPreview";

export type MediaCardItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
};

export function MediaCard({
  item,
  type,
  priority = false,
  sizes = "(max-width: 640px) 160px, 200px",
}: {
  item: MediaCardItem;
  type: "anime" | "series" | "movie" | "manga" | "novela";
  priority?: boolean;
  sizes?: string;
}) {
  const basePath =
    type === "novela"
      ? "novelas"
      : type === "movie"
        ? "filmes"
        : type === "anime"
          ? "animes"
          : type === "manga"
            ? "mangas"
            : type;

  const [isHovered, setIsHovered] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (type !== "anime") return;

    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    enterTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        setTriggerRect(cardRef.current.getBoundingClientRect());
        setIsHovered(true);
      }
    }, 500); // 500ms delay to prevent accidental hovers
  };

  const handleMouseLeave = () => {
    if (type !== "anime") return;

    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setTriggerRect(null);
    }, 200); // 200ms grace period
  };

  const handleModalMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleModalMouseLeave = () => {
    handleMouseLeave();
  };

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <Link
        ref={cardRef}
        href={`/${basePath}/${item.slug}`}
        className="flex flex-col gap-2 relative group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative overflow-hidden aspect-2/3">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 bg-zinc-900 border border-zinc-800">
              Sem imagem
            </div>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium text-[#f2f2f2] hover:text-white transition-colors">
          {item.title}
        </h3>
      </Link>

      {isHovered && triggerRect && type === "anime" && (
        <MediaCardPreview
          animeId={item.id}
          triggerRect={triggerRect}
          onMouseEnter={handleModalMouseEnter}
          onMouseLeave={handleModalMouseLeave}
        />
      )}
    </>
  );
}


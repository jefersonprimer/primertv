"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useState } from "react";
import { QuickViewModal } from "./QuickViewModal";

export type SearchTopResultItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl?: string | null;
  compactImageUrl?: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
};

export function SearchTopResultCard({
  item,
  type = "anime",
}: {
  item: SearchTopResultItem;
  type?: "anime" | "series" | "movie" | "manga" | "novela";
}) {
  const t = useTranslations("MediaCard");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bgImage = item.compactImageUrl || item.bannerUrl || item.imageUrl;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (type === "anime") {
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        e.button === 0
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsModalOpen(true);
      }
    }
  };

  const getAudioText = () => {
    if (item.isDubbed && item.isSubtitled) {
      return t("subDub");
    }
    if (item.isDubbed) {
      return t("dubbed");
    }
    if (item.isSubtitled) {
      return t("subtitled");
    }
    return null;
  };

  const audioText = getAudioText();

  return (
    <>
      <Link
        href={`/animes/${item.slug}`}
        onClick={handleClick}
        className="group relative flex flex-col gap-2 cursor-pointer"
      >
        {/* Background Image Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-zinc-950">
          {bgImage ? (
            <Image
              src={bgImage}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-zinc-500">
              Sem imagem
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Content Below Image */}
        <div className="flex flex-col gap-1.5 px-0.5">
          {/* Title */}
          <h3 className="line-clamp-2 text-base font-bold text-zinc-100 group-hover:text-white transition-colors">
            {item.title}
          </h3>

          {/* Audio Type */}
          {audioText && (
            <span className="text-xs font-medium text-zinc-400">
              {audioText}
            </span>
          )}
        </div>
      </Link>

      {isModalOpen && (
        <QuickViewModal
          slug={item.slug}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

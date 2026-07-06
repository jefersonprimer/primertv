"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export type MediaCardItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
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
  const t = useTranslations("MediaCard");

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

  return (
    <Link
      href={`/${basePath}/${item.slug}`}
      className="flex flex-col gap-2 relative group"
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
      <div className="flex flex-col gap-1">
        <h3 className="line-clamp-2 text-sm font-bold text-[#f2f2f2] hover:text-white transition-colors">
          {item.title}
        </h3>
        {type === "anime" && (item.isDubbed || item.isSubtitled) && (
          <div className="flex gap-1.5 self-start">
            {item.isDubbed && item.isSubtitled ? (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {t("subDub")}
              </span>
            ) : item.isDubbed ? (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {t("dubbed")}
              </span>
            ) : (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {t("subtitled")}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

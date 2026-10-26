"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import RatingBadge from "@/components/RatingBadge";
import { QuickViewModal } from "@/components/QuickViewModal";

type ListMediaCardItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  rating: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
};

export function ListMediaCard({
  item,
  type,
}: {
  item: ListMediaCardItem;
  type: "anime" | "series";
}) {
  const t = useTranslations("MediaCard");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(max-width: 1023px)").matches) return;
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
  };

  return (
    <>
      <Link
        href={`/${type === "anime" ? "animes" : "series"}/${item.slug}`}
        onClick={handleClick}
        className="group relative flex min-h-36 cursor-pointer gap-4 p-2 transition-colors hover:bg-[#2A2A2A] rounded-xl"
      >
        <div className="relative aspect-[2/3] w-20 shrink-0 self-start overflow-hidden rounded md:rounded-md bg-zinc-900 sm:aspect-video sm:w-[230px] sm:max-w-full sm:max-h-[130px]">
          {item.imageUrl || item.bannerUrl ? (
            <Image
              src={item.imageUrl || item.bannerUrl || ""}
              alt={item.title}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-300 group-hover:scale-105 sm:hidden"
            />
          ) : null}
          {item.bannerUrl || item.imageUrl ? (
            <Image
              src={item.bannerUrl || item.imageUrl || ""}
              alt={item.title}
              fill
              sizes="230px"
              className="hidden object-cover transition-transform duration-300 group-hover:scale-105 sm:block"
            />
          ) : null}
          {!item.imageUrl && !item.bannerUrl && (
            <div className="flex h-full items-center justify-center text-center text-xs text-zinc-400">
              Sem imagem
            </div>
          )}
          {item.rating && (
            <div className="absolute left-1 top-1">
              <RatingBadge rating={item.rating} size={20} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-2 py-1">
          <h3 className="line-clamp-2 text-base font-bold text-[#f2f2f2] transition-colors group-hover:text-white sm:text-lg">
            {item.title}
          </h3>
          {item.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-400">
              {item.description}
            </p>
          )}
          {type === "anime" && (item.isDubbed || item.isSubtitled) && (
            <span className="mt-auto text-sm font-normal text-[#8c8c8c]">
              {item.isDubbed && item.isSubtitled
                ? t("subDub")
                : item.isDubbed
                  ? t("dubbed")
                  : t("subtitled")}
            </span>
          )}
        </div>
      </Link>

      <QuickViewModal
        slug={item.slug}
        type={type}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

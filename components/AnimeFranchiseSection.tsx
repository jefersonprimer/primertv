"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Play, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FranchiseItem } from "@/lib/anime-relations";

interface AnimeFranchiseSectionProps {
  currentTitle?: string;
  sequel: FranchiseItem | null;
  prequel: FranchiseItem | null;
}

function FranchiseCard({
  item,
  badgeText,
  isSequel = false,
}: {
  item: FranchiseItem;
  badgeText: string;
  isSequel?: boolean;
}) {
  const t = useTranslations("AnimeDetails");
  const tMedia = useTranslations("MediaCard");

  return (
    <div className="group relative flex flex-col sm:flex-row gap-4 p-3.5 sm:p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/80 transition-all duration-300">
      {/* Poster */}
      <Link
        href={`/animes/${item.slug}`}
        className="relative aspect-[2/3] w-24 sm:w-28 shrink-0 overflow-hidden rounded-md bg-zinc-950 ring-1 ring-white/5 block"
      >
        {item.imageUrl || item.bannerUrl ? (
          <Image
            src={item.imageUrl || item.bannerUrl || ""}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
            {t("noImage")}
          </div>
        )}
      </Link>

      {/* Info & CTA */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {/* Header row: badge and rating */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                isSequel
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
              }`}
            >
              {badgeText}
            </span>

            {item.score && item.score > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{item.score.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <Link href={`/animes/${item.slug}`} className="group/title block">
            <h3 className="font-semibold text-base sm:text-lg text-[#f2f2f2] group-hover/title:text-white line-clamp-1 transition-colors">
              {item.title}
            </h3>
          </Link>

          {/* Subtitle / English Title */}
          {item.titleEnglish && item.titleEnglish !== item.title && (
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
              {item.titleEnglish}
            </p>
          )}

          {/* Metadata badges (Episodes / Dubbed / Subtitled) */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {item.totalEpisodes ? (
              <span className="text-xs text-zinc-400">
                {item.totalEpisodes} {item.totalEpisodes === 1 ? "ep" : "eps"}
              </span>
            ) : null}
            {item.isDubbed && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/40">
                {tMedia("dubbed")}
              </span>
            )}
            {item.isSubtitled && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/40">
                {tMedia("subtitled")}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-zinc-800/50">
          <Link
            href={item.firstEpisodeHref}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded text-xs font-semibold text-zinc-950 bg-white hover:bg-zinc-200 active:scale-95 transition-all shadow-sm"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{t("watchNow")}</span>
          </Link>

          <Link
            href={`/animes/${item.slug}`}
            className="inline-flex items-center justify-center px-3 py-2 rounded text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>{t("viewDetails")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AnimeFranchiseSection({
  sequel,
  prequel,
}: AnimeFranchiseSectionProps) {
  const t = useTranslations("AnimeDetails");

  if (!sequel && !prequel) {
    return null;
  }

  const isSingle = (sequel && !prequel) || (!sequel && prequel);

  return (
    <section className="mx-auto max-w-[1223px] px-4 md:px-8 lg:px-12 xl:px-0 py-8 ">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="text-xl md:text-2xl font-bold text-[#f2f2f2] tracking-tight">
          {t("franchiseTitle")}
        </h2>
        <p className="text-sm text-zinc-400">{t("franchiseSubtitle")}</p>
      </div>

      <div
        className={
          isSingle ? "max-w-xl" : "grid grid-cols-1 md:grid-cols-2 gap-4"
        }
      >
        {prequel && (
          <FranchiseCard
            item={prequel}
            badgeText={t("prequelTitle")}
            isSequel={false}
          />
        )}

        {sequel && (
          <FranchiseCard
            item={sequel}
            badgeText={t("sequelTitle")}
            isSequel={true}
          />
        )}
      </div>
    </section>
  );
}

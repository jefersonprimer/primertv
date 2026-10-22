"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Play, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FranchiseItem } from "@/lib/anime-relations";
import { WatchlistButton } from "@/components/WatchlistButton";

interface AnimeFranchiseSectionProps {
  currentTitle?: string;
  sequel: FranchiseItem | null;
  prequel: FranchiseItem | null;
  isLoggedIn?: boolean;
}

function FranchiseCard({
  item,
  badgeText,
  isSequel = false,
  isLoggedIn = false,
}: {
  item: FranchiseItem;
  badgeText: string;
  isSequel?: boolean;
  isLoggedIn?: boolean;
}) {
  const t = useTranslations("AnimeDetails");
  const tMedia = useTranslations("MediaCard");

  return (
    <div className="group relative flex gap-4 p-2 lg:p-4 rounded-md bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/80 transition-all duration-300">
      {/* Poster */}
      <Link
        href={`/animes/${item.slug}`}
        className="relative aspect-[2/3] w-24 lg:w-38 shrink-0 overflow-hidden rounded bg-zinc-950 ring-1 ring-white/5 block"
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
                  ? "bg-blue-500/10 text-blue-400 "
                  : "bg-zinc-800/80 text-zinc-300 "
              }`}
            >
              {badgeText}
            </span>
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

          {/* Description */}
          {item.description && (
            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 line-clamp-4 leading-relaxed">
              {item.description.replace(/\s+/g, " ").trim()}
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
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {tMedia("dubbed")}
              </span>
            )}
            {item.isSubtitled && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                {tMedia("subtitled")}
              </span>
            )}

            {item.score && item.score > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-800">
                <Star className="w-3 h-3 fill-zinc-300 text-zinc-300" />
                <span>{item.score.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-zinc-800/50">
          <Link
            href={item.firstEpisodeHref}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-200 active:scale-95 transition-all shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{t("watchNow")}</span>
          </Link>

          <WatchlistButton
            mediaType="ANIME"
            mediaId={item.id}
            slug={item.slug}
            initialInWatchlist={Boolean(item.inWatchlist)}
            isLoggedIn={isLoggedIn}
            size={20}
            compact
            showLabel
            roundedFull={false}
            hasBorder={false}
          />
        </div>
      </div>
    </div>
  );
}

export function AnimeFranchiseSection({
  sequel,
  prequel,
  isLoggedIn = false,
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
            isLoggedIn={isLoggedIn}
          />
        )}

        {sequel && (
          <FranchiseCard
            item={sequel}
            badgeText={t("sequelTitle")}
            isSequel={true}
            isLoggedIn={isLoggedIn}
          />
        )}
      </div>
    </section>
  );
}

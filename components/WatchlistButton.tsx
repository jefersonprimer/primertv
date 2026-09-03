"use client";

import { useTranslations } from "next-intl";
import { toggleWatchlist } from "@/app/actions/watchlist";
import type { WatchlistMediaType } from "@prisma/client";
import { Bookmark } from "lucide-react";
import { useActionState } from "react";
import { Link } from "@/i18n/routing";

type WatchlistButtonProps = {
  mediaType: WatchlistMediaType;
  mediaId: string;
  slug: string;
  initialInWatchlist: boolean;
  isLoggedIn: boolean;
  compact?: boolean;
  hasBorder?: boolean;
  roundedFull?: boolean;
  size?: number;
  className?: string;
};

export function WatchlistButton({
  mediaType,
  mediaId,
  slug,
  initialInWatchlist,
  isLoggedIn,
  compact,
  hasBorder = true,
  roundedFull = true,
  size,
  className = "",
}: WatchlistButtonProps) {
  const t = useTranslations("Watchlist");
  const [state, formAction, isPending] = useActionState(toggleWatchlist, {
    inWatchlist: initialInWatchlist,
  });

  const inWatchlist = state.inWatchlist ?? initialInWatchlist;

  const iconSize = size ?? (compact ? 14 : 16);
  const sizeClass = compact ? "p-1.5" : "h-[42px] w-[42px]";

  const borderClass = hasBorder ? "border border-zinc-800" : "";
  const roundedClass = roundedFull ? "rounded-full" : "rounded-md";

  const basePillClass = `group relative inline-flex items-center justify-center ${roundedClass} bg-zinc-900/90 ${borderClass} ${sizeClass} text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-700 hover:shadow-white/5 active:scale-95 focus:outline-none ${className}`;

  const tooltipElement = (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 text-xs font-normal text-white bg-[#272727] shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
      {t("tooltip")}
    </span>
  );

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className={basePillClass}
        title={t("tooltip")}
        aria-label={t("tooltip")}
      >
        <Bookmark
          size={iconSize}
          className="text-white transition-transform duration-200 group-hover:scale-110"
        />
        {tooltipElement}
      </Link>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-shrink-0">
      <input type="hidden" name="mediaType" value={mediaType} />
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={isPending}
        className={basePillClass}
        aria-label={t("tooltip")}
      >
        <Bookmark
          size={iconSize}
          className={`transition-transform duration-200 group-hover:scale-110 ${
            inWatchlist ? "fill-white text-white" : "text-white"
          }`}
        />
        {tooltipElement}
      </button>
    </form>
  );
}

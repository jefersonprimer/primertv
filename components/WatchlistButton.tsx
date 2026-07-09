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
};

export function WatchlistButton({
  mediaType,
  mediaId,
  slug,
  initialInWatchlist,
  isLoggedIn,
  compact = false,
  hasBorder = true,
  roundedFull = false,
}: WatchlistButtonProps) {
  const t = useTranslations("Watchlist");
  const [state, formAction, isPending] = useActionState(toggleWatchlist, {
    inWatchlist: initialInWatchlist,
  });

  const inWatchlist = state.inWatchlist ?? initialInWatchlist;

  let linkClass = hasBorder
    ? compact
      ? "flex h-8 w-8 items-center justify-center border-2 border-blue-700 hover:border-blue-600 text-blue-700 hover:text-blue-600 flex-shrink-0 transition-colors"
      : "flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border-2 border-blue-700 hover:border-blue-600 font-semibold text-blue-700 hover:text-blue-600 transition-colors md:px-2 md:py-1.5 flex-shrink-0"
    : compact
      ? "flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-blue-500 flex-shrink-0 transition-colors"
      : "flex h-10 w-10 items-center justify-center text-white hover:text-blue-600 flex-shrink-0 transition-colors";

  let buttonClass = hasBorder
    ? compact
      ? "flex h-8 w-8 items-center justify-center border-2 font-semibold transition-colors border-blue-600 hover:border-blue-700 text-blue-600 hover:text-blue-700"
      : "flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border-2 font-semibold transition-colors md:px-2 md:py-1.5 border-blue-600 hover:border-blue-700 text-blue-600 hover:text-blue-700"
    : compact
      ? `flex h-8 w-8 items-center justify-center transition-colors ${
          inWatchlist ? "text-blue-500" : "text-zinc-500 hover:text-blue-500"
        }`
      : `flex h-10 w-10 items-center justify-center transition-colors ${
          inWatchlist ? "text-blue-500" : "text-zinc-500 hover:text-blue-500"
        }`;

  if (roundedFull) {
    linkClass += " rounded-full";
    buttonClass += " rounded-full";
  }

  linkClass += " relative hover:[&>span]:opacity-100 hover:[&>span]:scale-100";
  buttonClass +=
    " relative hover:[&>span]:opacity-100 hover:[&>span]:scale-100";

  const tooltipElement = (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 text-xs font-semibold text-zinc-100 bg-[#272727] shadow-xl opacity-0 scale-95 pointer-events-none transition-all duration-200 ease-out whitespace-nowrap z-50">
      {t("tooltip")}
    </span>
  );

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={linkClass}>
        <Bookmark
          className={compact ? (hasBorder ? "h-6 w-6" : "h-4 w-4") : "h-6 w-6"}
        />
        {tooltipElement}
      </Link>
    );
  }

  return (
    <form action={formAction} className="flex-shrink-0">
      <input type="hidden" name="mediaType" value={mediaType} />
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" disabled={isPending} className={buttonClass}>
        <Bookmark
          className={
            compact
              ? hasBorder
                ? "h-4 w-4 fill-current"
                : `h-4 w-4 ${inWatchlist ? "fill-current" : ""}`
              : `h-6 w-6 ${inWatchlist ? "fill-current" : ""}`
          }
        />
        {tooltipElement}
      </button>
      {state.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}

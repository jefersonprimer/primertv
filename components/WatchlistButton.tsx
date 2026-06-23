"use client";

import { toggleWatchlist } from "@/app/actions/watchlist";
import type { WatchlistMediaType } from "@prisma/client";
import { Bookmark } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

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
  const [state, formAction, isPending] = useActionState(toggleWatchlist, {
    inWatchlist: initialInWatchlist,
  });

  const inWatchlist = state.inWatchlist ?? initialInWatchlist;

  let linkClass = hasBorder
    ? (compact
        ? "flex h-8 w-8 items-center justify-center border-2 border-blue-600 hover:border-blue-700 text-blue-600 hover:text-blue-700 flex-shrink-0 transition-colors"
        : "flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border-2 border-blue-600 hover:border-blue-700 font-semibold text-blue-600 hover:text-blue-700 transition-colors md:px-2 md:py-1.5 flex-shrink-0")
    : (compact
        ? "flex h-8 w-8 items-center justify-center text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-500 flex-shrink-0 transition-colors"
        : "flex h-10 w-10 items-center justify-center text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-500 flex-shrink-0 transition-colors");

  let buttonClass = hasBorder
    ? (compact
        ? "flex h-8 w-8 items-center justify-center border-2 font-semibold transition-colors border-blue-600 hover:border-blue-700 text-blue-600 hover:text-blue-700"
        : "flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border-2 font-semibold transition-colors md:px-2 md:py-1.5 border-blue-600 hover:border-blue-700 text-blue-600 hover:text-blue-700")
    : (compact
        ? `flex h-8 w-8 items-center justify-center transition-colors ${
            inWatchlist
              ? "text-blue-600 dark:text-blue-500"
              : "text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-500"
          }`
        : `flex h-10 w-10 items-center justify-center transition-colors ${
            inWatchlist
              ? "text-blue-600 dark:text-blue-500"
              : "text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-500"
          }`);

  if (roundedFull) {
    linkClass += " rounded-full";
    buttonClass += " rounded-full";
  }

  linkClass += " relative group";
  buttonClass += " relative group";

  const tooltipElement = (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-semibold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
      Minha Lista
    </span>
  );

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={linkClass}>
        <Bookmark
          className={
            compact
              ? (hasBorder ? "h-6 w-6" : "h-4 w-4")
              : "h-6 w-6"
          }
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
      <button
        type="submit"
        disabled={isPending}
        className={buttonClass}
      >
        <Bookmark
          className={
            compact
              ? (hasBorder ? "h-4 w-4 fill-current" : `h-4 w-4 ${inWatchlist ? "fill-current" : ""}`)
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

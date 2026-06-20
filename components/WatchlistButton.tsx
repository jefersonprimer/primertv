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
};

export function WatchlistButton({
  mediaType,
  mediaId,
  slug,
  initialInWatchlist,
  isLoggedIn,
  compact = false,
}: WatchlistButtonProps) {
  const [state, formAction, isPending] = useActionState(toggleWatchlist, {
    inWatchlist: initialInWatchlist,
  });

  const inWatchlist = state.inWatchlist ?? initialInWatchlist;

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className={
          compact
            ? "flex h-8 w-8 items-center justify-center border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/20 rounded-lg flex-shrink-0"
            : "flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border-2 border-blue-600 font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/20 md:px-4 md:py-2 flex-shrink-0"
        }
      >
        <Bookmark className={compact ? "h-4 w-4" : "h-5 w-5"} />
        {!compact && <span className="hidden md:inline">Adicionar à watchlist</span>}
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
        className={
          compact
            ? `flex h-8 w-8 items-center justify-center border-2 font-semibold transition-colors rounded-lg ${
                inWatchlist
                  ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
                  : "border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/20"
              }`
            : `flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border-2 font-semibold transition-colors md:px-4 md:py-2 ${
                inWatchlist
                  ? "border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40"
                  : "border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/20"
              }`
        }
      >
        <Bookmark className={compact ? "h-4 w-4 fill-current" : `h-6 w-6 ${inWatchlist ? "fill-current" : ""}`} />
        {!compact && (
          <span className="hidden md:inline">
            {isPending
              ? "Salvando..."
              : inWatchlist
                ? "Na watchlist"
                : "Adicionar à watchlist"}
          </span>
        )}
      </button>
      {state.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}

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
};

export function WatchlistButton({
  mediaType,
  mediaId,
  slug,
  initialInWatchlist,
  isLoggedIn,
}: WatchlistButtonProps) {
  const [state, formAction, isPending] = useActionState(toggleWatchlist, {
    inWatchlist: initialInWatchlist,
  });

  const inWatchlist = state.inWatchlist ?? initialInWatchlist;

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border border-zinc-300 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 md:px-4 md:py-2 flex-shrink-0"
      >
        <Bookmark className="h-5 w-5" />
        <span className="hidden md:inline">Adicionar à watchlist</span>
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
        className={`flex h-10 w-10 md:h-auto md:w-fit items-center justify-center md:gap-2 border font-semibold transition-colors md:px-4 md:py-2 ${
          inWatchlist
            ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
            : "border-zinc-300 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <Bookmark className={`h-5 w-5 ${inWatchlist ? "fill-current" : ""}`} />
        <span className="hidden md:inline">
          {isPending
            ? "Salvando..."
            : inWatchlist
              ? "Na watchlist"
              : "Adicionar à watchlist"}
        </span>
      </button>
      {state.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}

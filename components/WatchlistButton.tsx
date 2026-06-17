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
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 md:w-fit"
      >
        <Bookmark className="h-5 w-5" />
        Adicionar à watchlist
      </Link>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="mediaType" value={mediaType} />
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        disabled={isPending}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-3 font-semibold transition-colors md:w-fit ${
          inWatchlist
            ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
            : "border-zinc-300 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        <Bookmark className={`h-5 w-5 ${inWatchlist ? "fill-current" : ""}`} />
        {isPending
          ? "Salvando..."
          : inWatchlist
            ? "Na watchlist"
            : "Adicionar à watchlist"}
      </button>
      {state.error && (
        <p className="mt-2 text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}

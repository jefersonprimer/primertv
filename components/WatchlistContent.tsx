"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import FavoriteCard from "@/components/FavoriteCard";
import { MediaCard } from "@/components/MediaCard";
import { Link } from "@/i18n/routing";
import { loadWatchlistPage } from "@/app/actions/watchlist";
import type { WatchlistAudio, WatchlistPageItem, WatchlistSort } from "@/lib/watchlist-page-data";

function CardSkeleton() {
  return <div className="animate-pulse rounded-md p-2">
    <div className="aspect-video w-full rounded-md bg-zinc-800" />
    <div className="mt-3 h-4 w-3/4 rounded bg-zinc-800" />
    <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
  </div>;
}

export default function WatchlistContent({
  initialItems,
  initialHasMore,
}: {
  initialItems: WatchlistPageItem[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("Watchlist");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [sort, setSort] = useState<WatchlistSort>("newest");
  const [audio, setAudio] = useState<WatchlistAudio>("all");
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(async (reset = false, nextSort = sort, nextAudio = audio) => {
    if (loading && !reset) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const offset = reset ? 0 : items.length;
      const result = await loadWatchlistPage(offset, nextSort, nextAudio);
      if (id !== requestId.current) return;
      setItems((current) => reset ? result.items : [...current, ...result.items]);
      setHasMore(result.hasMore);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [audio, items.length, loading, sort]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void fetchPage();
    }, { rootMargin: "500px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPage, hasMore, loading]);

  const changeSort = (value: WatchlistSort) => {
    setSort(value);
    void fetchPage(true, value, audio);
  };
  const changeAudio = (value: WatchlistAudio) => {
    setAudio(value);
    void fetchPage(true, sort, value);
  };

  const empty = items.length === 0 && !loading;
  return <>
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between sm:pb-4 mx-2">
      <h1 className="text-xl font-bold tracking-tight text-white sm:text-[28px] mx-2 md:mx-0">{t("title")}</h1>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="watchlist-sort">{t("sortLabel")}</label>
        <select id="watchlist-sort" value={sort} onChange={(e) => changeSort(e.target.value as WatchlistSort)} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white">
          <option value="newest">{t("newest")}</option><option value="oldest">{t("oldest")}</option>
        </select>
        <label className="sr-only" htmlFor="watchlist-audio">{t("audioLabel")}</label>
        <select id="watchlist-audio" value={audio} onChange={(e) => changeAudio(e.target.value as WatchlistAudio)} className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white">
          <option value="all">{t("audioAll")}</option><option value="subtitle">{t("audioSubtitle")}</option><option value="dubbed">{t("audioDubbed")}</option>
        </select>
      </div>
    </div>
    {empty ? <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-xl text-zinc-500">{t("emptyTitle")}</p>
      <p className="mt-2 text-zinc-400">{t.rich("emptySubtitle", {
        animesLink: (chunks) => <Link href="/animes" className="text-blue-500 hover:underline">{chunks}</Link>,
        seriesLink: (chunks) => <Link href="/series" className="text-blue-500 hover:underline">{chunks}</Link>,
        mangasLink: (chunks) => <Link href="/mangas" className="text-blue-500 hover:underline">{chunks}</Link>,
      })}</p>
    </div> : <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((entry) => entry.kind === "anime"
          ? <div key={entry.id} className="hidden sm:block"><FavoriteCard item={entry.item} /></div>
          : entry.kind === "series"
            ? <MediaCard key={entry.id} item={entry.item} type="series" />
            : <MediaCard key={entry.id} item={entry.item} type="manga" />)}
      </div>
      <div className="flex sm:hidden flex-col gap-3 px-2">
        {items.filter((entry) => entry.kind === "anime").map((entry) => entry.kind === "anime" && <FavoriteCard key={entry.id} item={entry.item} isMobileRow className="w-full" />)}
      </div>
      {loading && <div aria-label={t("loadingMore")} className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 20 }, (_, i) => <CardSkeleton key={i} />)}
      </div>}
      <div ref={sentinel} className="h-1" />
    </>}
  </>;
}

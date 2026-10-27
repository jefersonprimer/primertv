"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadHistoryPage } from "@/app/actions/history";
import { HistoryCard, type HistoryItem } from "@/components/HistoryCard";

function HistoryCardSkeleton() {
  return <div className="flex animate-pulse flex-col gap-2 rounded-md p-2">
    <div className="aspect-video w-full rounded-md bg-zinc-800" />
    <div className="mt-1 h-4 w-3/4 rounded bg-zinc-800" />
    <div className="h-3 w-1/2 rounded bg-zinc-800" />
    <div className="h-3 w-2/3 rounded bg-zinc-800" />
  </div>;
}

function MobileHistoryCardSkeleton() {
  return <div className="flex w-full animate-pulse gap-4 p-2">
    <div className="aspect-[2/3] w-[84px] shrink-0 bg-zinc-800" />
    <div className="flex flex-1 flex-col justify-center gap-2">
      <div className="h-4 w-3/4 rounded bg-zinc-800" />
      <div className="h-3 w-1/3 rounded bg-zinc-800" />
      <div className="h-3 w-1/2 rounded bg-zinc-800" />
    </div>
  </div>;
}

export default function HistoryPageContent({
  initialItems,
  initialHasMore,
}: {
  initialItems: HistoryItem[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("History");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const loadingLock = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const fetchedCount = useRef(initialItems.length);

  const loadMore = useCallback(async () => {
    if (loadingLock.current || !hasMore) return;
    loadingLock.current = true;
    setLoading(true);
    try {
      const result = await loadHistoryPage(fetchedCount.current);
      fetchedCount.current += result.items.length;
      setItems((current) => [...current, ...result.items]);
      setHasMore(result.hasMore);
    } finally {
      loadingLock.current = false;
      setLoading(false);
    }
  }, [hasMore]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: "450px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  return <>
    <div className="hidden grid-cols-2 gap-4 sm:grid md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => <HistoryCard key={item.id} item={item} className="w-full" />)}
    </div>
    <div className="flex flex-col gap-3 px-2 sm:hidden">
      {items.map((item) => <HistoryCard key={item.id} item={item} isMobileRow className="w-full" />)}
    </div>
    {loading && <>
      <div aria-label={t("loadingMore")} className="hidden grid-cols-2 gap-4 sm:grid md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 20 }, (_, index) => <HistoryCardSkeleton key={index} />)}
      </div>
      <div aria-label={t("loadingMore")} className="flex flex-col gap-3 px-2 sm:hidden">
        {Array.from({ length: 20 }, (_, index) => <MobileHistoryCardSkeleton key={index} />)}
      </div>
    </>}
    <div ref={sentinel} className="h-1" />
  </>;
}

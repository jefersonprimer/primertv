"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadCustomListItems } from "@/app/actions/lists";
import { ListMediaCard } from "@/components/ListMediaCard";
import RemoveFromListButton from "@/components/RemoveFromListButton";

type Media = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  rating: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
};
type ListEntry = { id: string; anime: Media | null; series: Media | null };

function RowSkeleton() {
  return <div className="flex min-h-36 animate-pulse gap-4 p-2">
    <div className="h-28 w-20 shrink-0 rounded bg-zinc-800 sm:h-[130px] sm:w-[230px]" />
    <div className="flex flex-1 flex-col gap-3 pt-2">
      <div className="h-4 w-2/3 rounded bg-zinc-800" />
      <div className="h-3 w-full max-w-xl rounded bg-zinc-800" />
      <div className="h-3 w-1/3 rounded bg-zinc-800" />
    </div>
  </div>;
}

export default function CustomListItems({
  listId,
  initialItems,
  initialHasMore,
  initialTotal,
}: {
  listId: string;
  initialItems: ListEntry[];
  initialHasMore: boolean;
  initialTotal: number;
}) {
  const t = useTranslations("Lists");
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const fetchedCount = useRef(initialItems.length);
  const loadingLock = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingLock.current || !hasMore) return;
    loadingLock.current = true;
    setLoading(true);
    try {
      const result = await loadCustomListItems(listId, fetchedCount.current);
      fetchedCount.current += result.items.length;
      setItems((current) => [...current, ...result.items]);
      setHasMore(result.hasMore);
      setTotal(result.total);
    } finally {
      loadingLock.current = false;
      setLoading(false);
    }
  }, [hasMore, listId]);

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
    <div className="text-xs font-medium text-[#bbb] mt-2 mb-6">
      {t("itemsAdded", { count: total })}
    </div>
    <div className="divide-y divide-zinc-800">
      {items.map((item) => {
        const mediaItem = item.anime || item.series;
        if (!mediaItem) return null;
        return <div key={item.id} className="relative group animate-in fade-in zoom-in-95 duration-200 py-2 first:pt-0 last:pb-0">
          <RemoveFromListButton
            listId={listId}
            animeId={item.anime?.id}
            seriesId={item.series?.id}
            onRemoved={() => {
              fetchedCount.current = Math.max(0, fetchedCount.current - 1);
              setItems((current) => current.filter((entry) => entry.id !== item.id));
              setTotal((count) => Math.max(0, count - 1));
            }}
          />
          <ListMediaCard item={mediaItem} type={item.anime ? "anime" : "series"} />
        </div>;
      })}
    </div>
    {loading && <div aria-label={t("loadingMoreItems")} className="divide-y divide-zinc-800">
      {Array.from({ length: 20 }, (_, index) => <RowSkeleton key={index} />)}
    </div>}
    <div ref={sentinel} className="h-1" />
  </>;
}

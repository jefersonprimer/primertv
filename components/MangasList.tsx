"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MediaCard } from "./MediaCard";
import { getMangas, MangaItem } from "@/app/actions/mangas";

interface MangasListProps {
  initialItems: MangaItem[];
  initialHasMore: boolean;
}

export function MangasList({ initialItems, initialHasMore }: MangasListProps) {
  const [items, setItems] = useState<MangaItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = pageRef.current + 1;
      const res = await getMangas({
        page: nextPage,
        limit: 24,
      });

      if (res.items.length > 0) {
        pageRef.current = nextPage;

        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = res.items.filter(
            (item) => !existingIds.has(item.id),
          );
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      }

      setHasMore(res.hasMore);
    } catch (err) {
      console.error("Erro ao carregar mais mangás:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const observerTarget = observerRef.current;
    if (!observerTarget || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0,
      },
    );

    observer.observe(observerTarget);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} type="manga" />
        ))}

        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 24 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="flex flex-col gap-3 animate-pulse"
            >
              <div className="relative aspect-[2/3] w-full bg-zinc-800 shadow-md" />
              <div className="h-4 w-3/4 bg-zinc-800" />
            </div>
          ))}
      </div>

      {hasMore && <div ref={observerRef} className="h-px w-full" aria-hidden />}
    </div>
  );
}

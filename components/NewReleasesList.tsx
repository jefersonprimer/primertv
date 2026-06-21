"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tv } from "lucide-react";
import { getNewReleases, ReleaseItem } from "@/app/actions/newReleases";

interface NewReleasesListProps {
  initialItems: ReleaseItem[];
  initialHasMore: boolean;
  activeTab: "animes" | "series" | "novelas" | "filmes" | "mangas";
}

export function NewReleasesList({
  initialItems,
  initialHasMore,
  activeTab,
}: NewReleasesListProps) {
  const [items, setItems] = useState<ReleaseItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(initialHasMore);

  hasMoreRef.current = hasMore;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const nextPage = pageRef.current + 1;
      const res = await getNewReleases({
        type: activeTab,
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
      console.error("Erro ao carregar mais lançamentos:", err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [activeTab]);

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

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
          <Tv className="h-12 w-12 text-zinc-400" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Nenhum lançamento adicionado
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Não encontramos nenhum item cadastrado recentemente para essa
          categoria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {items.map((item) => (
          <Link
            key={`${item.id}-${item.slug}`}
            href={item.href}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-md ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-blue-500/15">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={false}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500 text-sm">
                  Sem imagem
                </div>
              )}

              {/* Hover play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transform scale-90 transition-transform duration-300 group-hover:scale-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-blue-500">
                {item.title}
              </h3>
              <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {item.timeAgo}
              </span>
            </div>
          </Link>
        ))}

        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="flex flex-col gap-3 animate-pulse"
            >
              <div className="relative aspect-[2/3] w-full bg-zinc-200 dark:bg-zinc-800 shadow-md ring-1 ring-black/5 dark:ring-white/10" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
      </div>

      {hasMore && (
        <div ref={observerRef} className="h-px w-full" aria-hidden />
      )}
    </div>
  );
}

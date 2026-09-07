"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Award, Tv, Star, Trophy, ChevronDown, Filter } from "lucide-react";
import { getPopularAnimes, PopularAnimeItem } from "@/app/actions/popular";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { QuickViewModal } from "./QuickViewModal";

interface PopularAnimesListProps {
  title?: string;
  initialItems: PopularAnimeItem[];
  initialHasMore: boolean;
}

export function PopularAnimesList({
  title,
  initialItems,
  initialHasMore,
}: PopularAnimesListProps) {
  const t = useTranslations("MediaCard");
  const tFilter = useTranslations("PopularPage.filters");
  type FilterType = "all" | "airing" | "upcoming" | "bypopularity";
  const [filter, setFilter] = useState<FilterType>("all");
  const [items, setItems] = useState<PopularAnimeItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const handleItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    slug: string,
  ) => {
    if (
      !e.ctrlKey &&
      !e.metaKey &&
      !e.shiftKey &&
      !e.altKey &&
      e.button === 0
    ) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedSlug(slug);
    }
  };

  const observerRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = async (newFilter: FilterType) => {
    if (newFilter === filter || loading) return;
    setFilter(newFilter);
    setLoading(true);
    setPage(1);

    try {
      const res = await getPopularAnimes({
        page: 1,
        limit: 24,
        filter: newFilter,
      });
      setItems(res.items);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("Erro ao filtrar animes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const res = await getPopularAnimes({
        page: nextPage,
        limit: 24,
        filter,
      });

      if (res.items.length > 0) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = res.items.filter(
            (item) => !existingIds.has(item.id),
          );
          return [...prev, ...newItems];
        });
        setPage(nextPage);
      }
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("Erro ao carregar mais animes populares:", err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, filter]);

  // Set up IntersectionObserver
  useEffect(() => {
    const observerTarget = observerRef.current;
    if (!observerTarget || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: "200px", // Pre-fetch when user is 200px from the bottom
        threshold: 0.1,
      },
    );

    observer.observe(observerTarget);

    return () => {
      if (observerTarget) {
        observer.unobserve(observerTarget);
      }
    };
  }, [hasMore, loadMore]);

  // Rank badge styling helper
  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black border-amber-300 ring-2 ring-yellow-400/30 font-black";
    }
    if (rank === 2) {
      return "bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-500 text-black border-zinc-200 ring-2 ring-zinc-400/30 font-black";
    }
    if (rank === 3) {
      return "bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white border-amber-500 ring-2 ring-amber-700/30 font-black";
    }
    return "bg-black/80 text-zinc-200 border-zinc-800 backdrop-blur-md";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return <Trophy className="h-3 w-3 text-black animate-pulse" />;
    if (rank === 2) return <Award className="h-3 w-3 text-black" />;
    if (rank === 3) return <Award className="h-3 w-3 text-white" />;
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header with Title on Left and Dropdown Filter on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        {title && (
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-[28px]">
            {title}
          </h1>
        )}

        {/* Dropdown Filter */}
        <div className="relative inline-block text-left sm:ml-auto">
          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <select
              value={filter}
              onChange={(e) =>
                handleFilterChange(e.target.value as FilterType)
              }
              disabled={loading}
              className="appearance-none cursor-pointer bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-100 text-sm font-semibold pl-10 pr-10 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            >
              <option value="all">{tFilter("all")}</option>
              <option value="bypopularity">{tFilter("bypopularity")}</option>
              <option value="airing">{tFilter("airing")}</option>
              <option value="upcoming">{tFilter("upcoming")}</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {items.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full p-4 bg-zinc-900">
            <Tv className="h-12 w-12 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-zinc-100">
            Nenhum anime encontrado
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/animes/${item.slug}`}
            onClick={(e) => handleItemClick(e, item.slug)}
            className="group flex flex-col gap-3"
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900 shadow-md ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-blue-500/20">
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

              {/* Rank Badge */}
              <div
                className={`absolute top-0 left-0 z-10 flex items-center gap-1 rounded-br px-2.5 py-1 text-xs font-black shadow-md ${getRankBadgeStyle(
                  item.rank,
                )}`}
              >
                {getRankIcon(item.rank)}
                <span>#{item.rank}</span>
              </div>

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
              <h3 className="line-clamp-2 text-sm font-semibold text-white">
                {item.title}
              </h3>
              {(item.isDubbed || item.isSubtitled) && (
                <div className="flex gap-1.5 self-start">
                  {item.isDubbed && item.isSubtitled ? (
                    <span className="text-sm text-[#8c8c8c] font-normal">
                      {t("subDub")}
                    </span>
                  ) : item.isDubbed ? (
                    <span className="text-sm text-[#8c8c8c] font-normal">
                      {t("dubbed")}
                    </span>
                  ) : (
                    <span className="text-sm text-[#8c8c8c] font-normal">
                      {t("subtitled")}
                    </span>
                  )}
                </div>
              )}

              {item.score && (
                <span className="text-xs font-semibold text-amber-500 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {item.score}
                </span>
              )}

              {item.members && (
                <span className="text-xs text-zinc-400 font-medium">
                  {item.members.toLocaleString()} membros
                </span>
              )}
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
              <div className="relative aspect-[2/3] w-full rounded-md bg-zinc-800 shadow-md ring-1 ring-white/10" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-zinc-800" />
                <div className="h-3.5 w-1/3 bg-zinc-800" />
                <div className="h-3 w-1/2 bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Target element for IntersectionObserver */}
      {hasMore && !loading && (
        <div
          ref={observerRef}
          className="h-10 w-full flex justify-center items-center"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-blue-600 border-t-blue-500" />
        </div>
      )}

      {selectedSlug && (
        <QuickViewModal
          slug={selectedSlug}
          isOpen={!!selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}

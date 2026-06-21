"use server";

import { prisma } from "@/lib/prisma";

export interface ReleaseItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  href: string;
  timeAgo: string;
  addedAt: string; // Serialized Date ISO String
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();

  if (diffMs < 0) return "Agora mesmo";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) {
    return "Agora mesmo";
  }
  if (diffMins < 60) {
    return `Há ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  }
  if (diffHours < 24) {
    return `Há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  }
  if (diffDays < 7) {
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }
  if (diffWeeks < 4) {
    return `Há ${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"}`;
  }
  return `Há ${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
}

export async function getNewReleases({
  type,
  page = 1,
  limit = 24,
}: {
  type: "animes" | "series" | "novelas" | "filmes" | "mangas";
  page: number;
  limit?: number;
}): Promise<{ items: ReleaseItem[]; hasMore: boolean }> {
  let items: any[] = [];
  const maxItemsToFetch = 360; // 15 pages of 24, plenty of scroll space!

  try {
    if (type === "animes") {
      const recentAnimes = await prisma.anime.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          seasons: {
            include: {
              episodes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        take: maxItemsToFetch,
      });

      const processed = recentAnimes.map((anime) => {
        let latestDate = anime.updatedAt;
        for (const season of anime.seasons) {
          if (season.episodes.length > 0) {
            const epDate = new Date(season.episodes[0].createdAt);
            if (epDate > latestDate) {
              latestDate = epDate;
            }
          }
        }
        return {
          id: anime.id,
          slug: anime.slug,
          title: anime.title,
          imageUrl: anime.imageUrl,
          addedAt: latestDate,
          href: `/animes/${anime.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed;
    } else if (type === "series") {
      const recentSeries = await prisma.series.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          seasons: {
            include: {
              episodes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        take: maxItemsToFetch,
      });

      const processed = recentSeries.map((series) => {
        let latestDate = series.updatedAt;
        for (const season of series.seasons) {
          if (season.episodes.length > 0) {
            const epDate = new Date(season.episodes[0].createdAt);
            if (epDate > latestDate) {
              latestDate = epDate;
            }
          }
        }
        return {
          id: series.id,
          slug: series.slug,
          title: series.title,
          imageUrl: series.imageUrl,
          addedAt: latestDate,
          href: `/series/${series.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed;
    } else if (type === "novelas") {
      const recentNovelas = await prisma.novela.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          seasons: {
            include: {
              episodes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        take: maxItemsToFetch,
      });

      const processed = recentNovelas.map((novela) => {
        let latestDate = novela.updatedAt;
        for (const season of novela.seasons) {
          if (season.episodes.length > 0) {
            const epDate = new Date(season.episodes[0].createdAt);
            if (epDate > latestDate) {
              latestDate = epDate;
            }
          }
        }
        return {
          id: novela.id,
          slug: novela.slug,
          title: novela.title,
          imageUrl: novela.imageUrl,
          addedAt: latestDate,
          href: `/novelas/${novela.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed;
    } else if (type === "filmes") {
      const movies = await prisma.movie.findMany({
        orderBy: { createdAt: "desc" },
        take: maxItemsToFetch,
      });

      items = movies.map((movie) => ({
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        imageUrl: movie.imageUrl,
        addedAt: movie.createdAt,
        href: `/filmes/${movie.slug}`,
      }));
    } else if (type === "mangas") {
      const recentMangas = await prisma.manga.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          chapters: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        take: maxItemsToFetch,
      });

      const processed = recentMangas.map((manga) => {
        let latestDate = manga.updatedAt;
        if (manga.chapters.length > 0) {
          const chDate = new Date(manga.chapters[0].createdAt);
          if (chDate > latestDate) {
            latestDate = chDate;
          }
        }
        return {
          id: manga.id,
          slug: manga.slug,
          title: manga.title,
          imageUrl: manga.imageUrl,
          addedAt: latestDate,
          href: `/mangas/${manga.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed;
    }
  } catch (error) {
    console.error("Error loading new releases in server action:", error);
    return { items: [], hasMore: false };
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const slicedItems = items.slice(startIndex, endIndex);

  const finalItems = slicedItems.map((item) => ({
    ...item,
    addedAt: item.addedAt.toISOString(),
    timeAgo: formatTimeAgo(item.addedAt),
  }));

  return {
    items: finalItems,
    hasMore: endIndex < items.length,
  };
}

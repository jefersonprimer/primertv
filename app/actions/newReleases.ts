"use server";

import { getLatestReleaseRows } from "@/lib/media-performance";

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
  type ReleaseItemData = Omit<ReleaseItem, "addedAt" | "timeAgo"> & {
    addedAt: Date;
  };

  let items: ReleaseItemData[] = [];
  const maxItemsToFetch = 120;

  try {
    const recentItems = await getLatestReleaseRows(type, maxItemsToFetch);

    items = recentItems.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      imageUrl: item.imageUrl,
      addedAt: item.addedAt,
      href:
        type === "animes"
          ? `/animes/${item.slug}`
          : type === "series"
            ? `/series/${item.slug}`
            : type === "novelas"
              ? `/novelas/${item.slug}`
              : type === "filmes"
                ? `/filmes/${item.slug}`
                : `/mangas/${item.slug}`,
    }));
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

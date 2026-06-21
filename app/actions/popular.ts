"use server";

import { prisma } from "@/lib/prisma";

export interface PopularAnimeItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  rating: string | null;
  status: string | null;
  score: number | null;
  rank: number;
  popularity: number | null;
  members: number | null;
}

export async function getPopularAnimes({
  page = 1,
  limit = 24,
}: {
  page: number;
  limit?: number;
}): Promise<{ items: PopularAnimeItem[]; hasMore: boolean }> {
  try {
    const skip = (page - 1) * limit;

    const animes = await prisma.anime.findMany({
      where: {
        rank: {
          not: null,
        },
      },
      orderBy: {
        rank: "asc",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        rating: true,
        status: true,
        score: true,
        rank: true,
        popularity: true,
        members: true,
      },
      skip,
      take: limit + 1, // Fetch one extra to determine hasMore
    });

    const hasMore = animes.length > limit;
    const items = animes.slice(0, limit) as PopularAnimeItem[];

    return {
      items,
      hasMore,
    };
  } catch (error) {
    console.error("Error loading popular animes in server action:", error);
    return { items: [], hasMore: false };
  }
}

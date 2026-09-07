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
  isDubbed?: boolean;
  isSubtitled?: boolean;
}

export async function getPopularAnimes({
  page = 1,
  limit = 24,
  filter = "all",
}: {
  page: number;
  limit?: number;
  filter?: "all" | "airing" | "upcoming" | "bypopularity";
}): Promise<{ items: PopularAnimeItem[]; hasMore: boolean }> {
  try {
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {};

    if (filter === "airing") {
      whereClause.rank = { not: null };
      whereClause.status = {
        contains: "Airing",
        mode: "insensitive",
      };
    } else if (filter === "upcoming") {
      whereClause.status = {
        contains: "Not yet aired",
        mode: "insensitive",
      };
    } else if (filter === "bypopularity") {
      whereClause.popularity = { not: null };
    } else {
      whereClause.rank = { not: null };
    }

    let orderByClause: Array<Record<string, "asc" | "desc">> = [
      { rank: "asc" },
    ];

    if (filter === "upcoming" || filter === "bypopularity") {
      orderByClause = [{ popularity: "asc" }, { createdAt: "desc" }];
    }

    const animes = await prisma.anime.findMany({
      where: whereClause,
      orderBy: orderByClause,
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
        isDubbed: true,
        isSubtitled: true,
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

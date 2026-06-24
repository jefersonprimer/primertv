"use server";

import { prisma } from "@/lib/prisma";

export interface MangaItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
}

export async function getMangas({
  page = 1,
  limit = 24,
}: {
  page: number;
  limit?: number;
}) {
  try {
    const skip = (page - 1) * limit;

    const mangas = await prisma.manga.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      skip,
      take: limit + 1, // Fetch one extra to determine hasMore
    });

    const hasMore = mangas.length > limit;
    const items = mangas.slice(0, limit);

    return {
      items,
      hasMore,
    };
  } catch (error) {
    console.error("Error loading mangas in server action:", error);
    return { items: [], hasMore: false };
  }
}

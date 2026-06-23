"use server";

import { prisma } from "@/lib/prisma";

export interface NovelaItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
}

export async function getNovelas({
  page = 1,
  limit = 24,
}: {
  page: number;
  limit?: number;
}) {
  try {
    const skip = (page - 1) * limit;

    const novelas = await prisma.novela.findMany({
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

    const hasMore = novelas.length > limit;
    const items = novelas.slice(0, limit);

    return {
      items,
      hasMore,
    };
  } catch (error) {
    console.error("Error loading novelas in server action:", error);
    return { items: [], hasMore: false };
  }
}

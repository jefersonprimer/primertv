'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { revalidatePath } from "next/cache";

export interface RatingBreakdown {
  score: number;
  count: number;
  percentage: number;
}

export interface AnimeRatingStats {
  averageScore: number;
  totalVotes: number;
  userScore: number | null;
  breakdown: RatingBreakdown[];
}

export async function getAnimeRatingStats(
  animeId: string,
): Promise<AnimeRatingStats> {
  try {
    const userId = await getAuthenticatedUserId();

    const [ratings, userRating, anime] = await Promise.all([
      prisma.animeRating.findMany({
        where: { animeId },
        select: { score: true },
      }),
      userId
        ? prisma.animeRating.findUnique({
            where: {
              userId_animeId: { userId, animeId },
            },
            select: { score: true },
          })
        : null,
      prisma.anime.findUnique({
        where: { id: animeId },
        select: { score: true, slug: true },
      }),
    ]);

    const totalVotes = ratings.length;
    const counts: Record<number, number> = {
      10: 0,
      9: 0,
      8: 0,
      7: 0,
      6: 0,
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let sum = 0;
    ratings.forEach((r) => {
      if (counts[r.score] !== undefined) {
        counts[r.score] += 1;
      }
      sum += r.score;
    });

    // If there are user ratings, use their calculated average;
    // fallback to anime.score if no user ratings yet
    let averageScore = totalVotes > 0 ? sum / totalVotes : anime?.score ?? 0;
    averageScore = Math.round(averageScore * 10) / 10;

    const breakdown: RatingBreakdown[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(
      (s) => {
        const count = counts[s] || 0;
        const percentage =
          totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          score: s,
          count,
          percentage,
        };
      },
    );

    return {
      averageScore,
      totalVotes,
      userScore: userRating?.score ?? null,
      breakdown,
    };
  } catch (error) {
    console.error("Failed to get anime rating stats:", error);
    return {
      averageScore: 0,
      totalVotes: 0,
      userScore: null,
      breakdown: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => ({
        score: s,
        count: 0,
        percentage: 0,
      })),
    };
  }
}

export async function rateAnime(
  animeId: string,
  score: number,
): Promise<{
  success?: boolean;
  error?: string;
  stats?: AnimeRatingStats;
}> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: "unauthorized" };
    }

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return { error: "invalid_score" };
    }

    const anime = await prisma.anime.findUnique({
      where: { id: animeId },
      select: { id: true, slug: true },
    });

    if (!anime) {
      return { error: "anime_not_found" };
    }

    await prisma.animeRating.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
      update: {
        score,
      },
      create: {
        userId,
        animeId,
        score,
      },
    });

    // Recalculate average score for this anime
    const ratings = await prisma.animeRating.findMany({
      where: { animeId },
      select: { score: true },
    });

    const totalVotes = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    const avgScore = totalVotes > 0 ? Math.round((sum / totalVotes) * 10) / 10 : 0;

    // Update anime score column in database
    await prisma.anime.update({
      where: { id: animeId },
      data: { score: avgScore },
    });

    if (anime.slug) {
      revalidatePath(`/[locale]/animes/${anime.slug}`, "page");
    }

    const stats = await getAnimeRatingStats(animeId);
    return { success: true, stats };
  } catch (error) {
    console.error("Failed to rate anime:", error);
    return { error: "Failed to submit rating" };
  }
}

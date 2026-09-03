'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { revalidatePath } from "next/cache";
import { calculateUserVoteWeight } from "@/lib/rating/trust";
import { calculateAnimeBayesianScore } from "@/lib/rating/bayesian";

export interface RatingBreakdown {
  score: number;
  count: number;
  percentage: number;
}

export interface AnimeRatingStats {
  averageScore: number;
  totalVotes: number;
  userScore: number | null;
  userWeight?: number;
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
        select: { score: true, weight: true },
      }),
      userId
        ? prisma.animeRating.findUnique({
            where: {
              userId_animeId: { userId, animeId },
            },
            select: { score: true, weight: true },
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

    ratings.forEach((r) => {
      if (counts[r.score] !== undefined) {
        counts[r.score] += 1;
      }
    });

    const bayesianResult = await calculateAnimeBayesianScore(animeId);
    const averageScore = totalVotes > 0 ? bayesianResult.bayesianScore : anime?.score ?? 0;

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
      userWeight: userRating?.weight ?? undefined,
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
  message?: string;
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

    // Compute account trust weight for this user
    const trustDetails = await calculateUserVoteWeight(userId);

    await prisma.animeRating.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId,
        },
      },
      update: {
        score,
        weight: trustDetails.weight,
      },
      create: {
        userId,
        animeId,
        score,
        weight: trustDetails.weight,
      },
    });

    // Recalculate Bayesian score for this anime
    const bayesianResult = await calculateAnimeBayesianScore(animeId);

    // Update anime score column in database with Bayesian rating
    await prisma.anime.update({
      where: { id: animeId },
      data: { score: bayesianResult.bayesianScore },
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


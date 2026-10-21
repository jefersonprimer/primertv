'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { revalidatePath } from "next/cache";
import {
  calculateUserVoteWeight,
  type UserTrustTier,
} from "@/lib/rating/trust";
import { calculateAnimeBayesianScore } from "@/lib/rating/bayesian";
import { getPlatformRatingRanking } from "@/lib/rating/ranking";

export interface RatingBreakdown {
  score: number;
  count: number;
  percentage: number;
}

/** How the community reacted, grouped by score range. */
export interface RatingSentiment {
  /** Votes between 8 and 10. */
  positive: number;
  positivePercentage: number;
  /** Votes between 4 and 7. */
  neutral: number;
  neutralPercentage: number;
  /** Votes between 1 and 3. */
  negative: number;
  negativePercentage: number;
}

/** Statistical confidence of the score, derived from the amount of votes. */
export type RatingConfidence = "low" | "medium" | "high";

export interface AnimeRatingStats {
  averageScore: number;
  totalVotes: number;
  userScore: number | null;
  userWeight?: number;
  /** Trust tier of the signed-in account, used to explain the vote weight. */
  userTier?: UserTrustTier | null;
  breakdown: RatingBreakdown[];
  /** Plain arithmetic mean of every vote. */
  rawAverage: number;
  /** Mean weighted by the anti-review-bomb trust weight. */
  weightedAverage: number;
  /** Sum of the trust weights of all votes. */
  weightedVotes: number;
  /** Middle score of the distribution (50th percentile). */
  median: number | null;
  /** Standard deviation of the votes — how much the community agrees. */
  standardDeviation: number;
  /** Score given by most users. */
  mostVotedScore: number | null;
  /** Share of the votes that used `mostVotedScore`. */
  mostVotedPercentage: number;
  /** Average score of every anime rated on the platform. */
  globalAverage: number;
  /** Total amount of votes registered on the platform. */
  globalVotes: number;
  /** Position of this anime among all rated anime (1 = best rated). */
  platformRank: number | null;
  /** How many anime have community votes on the platform. */
  rankedAnimes: number;
  /** Percentage of rated anime rated this anime better than (0-100). */
  platformPercentile: number | null;
  sentiment: RatingSentiment;
  confidence: RatingConfidence;
}

const EMPTY_BREAKDOWN: RatingBreakdown[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(
  (score) => ({ score, count: 0, percentage: 0 }),
);

const EMPTY_SENTIMENT: RatingSentiment = {
  positive: 0,
  positivePercentage: 0,
  neutral: 0,
  neutralPercentage: 0,
  negative: 0,
  negativePercentage: 0,
};

function resolveConfidence(totalVotes: number): RatingConfidence {
  if (totalVotes >= 150) return "high";
  if (totalVotes >= 25) return "medium";
  return "low";
}

/**
 * Builds the full set of statistics shown by the rating panel.
 * All values are derived from the real votes stored in the database.
 */
function buildRatingStats(
  scores: number[],
  bayesian: {
    bayesianScore: number;
    weightedAverage: number;
    weightedVotes: number;
    globalAverage: number;
    globalVotes: number;
  },
  fallbackScore: number,
  userScore: number | null,
  userWeight: number | undefined,
  userTier: UserTrustTier | null,
  platform: {
    rank: number | null;
    total: number;
    percentile: number | null;
  },
): AnimeRatingStats {
  const totalVotes = scores.length;

  if (totalVotes === 0) {
    return {
      averageScore: fallbackScore,
      totalVotes: 0,
      userScore,
      userWeight,
      userTier,
      breakdown: EMPTY_BREAKDOWN.map((item) => ({ ...item })),
      rawAverage: 0,
      weightedAverage: 0,
      weightedVotes: 0,
      median: null,
      standardDeviation: 0,
      mostVotedScore: null,
      mostVotedPercentage: 0,
      globalAverage: bayesian.globalAverage,
      globalVotes: bayesian.globalVotes,
      platformRank: platform.rank,
      rankedAnimes: platform.total,
      platformPercentile: platform.percentile,
      sentiment: { ...EMPTY_SENTIMENT },
      confidence: "low",
    };
  }

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

  let rawSum = 0;
  for (const score of scores) {
    if (counts[score] !== undefined) counts[score] += 1;
    rawSum += score;
  }

  const rawAverage = rawSum / totalVotes;

  // Standard deviation — how spread the community opinion is
  const variance =
    scores.reduce((acc, score) => acc + (score - rawAverage) ** 2, 0) /
    totalVotes;
  const standardDeviation = Math.round(Math.sqrt(variance) * 100) / 100;

  const breakdown: RatingBreakdown[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(
    (score) => {
      const count = counts[score] || 0;
      return {
        score,
        count,
        percentage: Math.round((count / totalVotes) * 100),
      };
    },
  );

  // Median — middle value of the sorted distribution
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  // Most voted score — ties are resolved by the score closest to the average
  let mostVotedScore: number | null = null;
  let mostVotedCount = 0;
  for (const score of [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]) {
    const count = counts[score] || 0;
    if (
      count > mostVotedCount ||
      (count === mostVotedCount &&
        count > 0 &&
        mostVotedScore !== null &&
        Math.abs(score - rawAverage) < Math.abs(mostVotedScore - rawAverage))
    ) {
      mostVotedScore = score;
      mostVotedCount = count;
    }
  }

  const positive = (counts[8] || 0) + (counts[9] || 0) + (counts[10] || 0);
  const negative = (counts[1] || 0) + (counts[2] || 0) + (counts[3] || 0);
  const neutral = totalVotes - positive - negative;

  const sentiment: RatingSentiment = {
    positive,
    positivePercentage: Math.round((positive / totalVotes) * 100),
    neutral,
    neutralPercentage: Math.round((neutral / totalVotes) * 100),
    negative,
    negativePercentage: Math.round((negative / totalVotes) * 100),
  };

  return {
    averageScore: bayesian.bayesianScore,
    totalVotes,
    userScore,
    userWeight,
    userTier,
    breakdown,
    rawAverage: Math.round(rawAverage * 10) / 10,
    weightedAverage: bayesian.weightedAverage,
    weightedVotes: bayesian.weightedVotes,
    median,
    standardDeviation,
    mostVotedScore,
    mostVotedPercentage: mostVotedScore
      ? Math.round(((counts[mostVotedScore] || 0) / totalVotes) * 100)
      : 0,
    globalAverage: bayesian.globalAverage,
    globalVotes: bayesian.globalVotes,
    platformRank: platform.rank,
    rankedAnimes: platform.total,
    platformPercentile: platform.percentile,
    sentiment,
    confidence: resolveConfidence(totalVotes),
  };
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

    const [bayesianResult, ranking, trustDetails] = await Promise.all([
      calculateAnimeBayesianScore(animeId),
      getPlatformRatingRanking(),
      userId ? calculateUserVoteWeight(userId) : Promise.resolve(null),
    ]);

    const platformEntry = ranking.find((entry) => entry.animeId === animeId);
    const rankedAnimes = ranking.length;
    const platformRank = platformEntry?.rank ?? null;
    const platformPercentile =
      platformEntry && rankedAnimes > 0
        ? Math.round(((rankedAnimes - platformEntry.rank) / rankedAnimes) * 100)
        : null;

    return buildRatingStats(
      ratings.map((r) => r.score),
      bayesianResult,
      anime?.score ?? 0,
      userRating?.score ?? null,
      userRating?.weight ?? undefined,
      trustDetails?.tier ?? null,
      { rank: platformRank, total: rankedAnimes, percentile: platformPercentile },
    );
  } catch (error) {
    console.error("Failed to get anime rating stats:", error);
    return {
      averageScore: 0,
      totalVotes: 0,
      userScore: null,
      breakdown: EMPTY_BREAKDOWN.map((item) => ({ ...item })),
      rawAverage: 0,
      weightedAverage: 0,
      weightedVotes: 0,
      median: null,
      standardDeviation: 0,
      mostVotedScore: null,
      mostVotedPercentage: 0,
      globalAverage: 0,
      globalVotes: 0,
      platformRank: null,
      rankedAnimes: 0,
      platformPercentile: null,
      sentiment: { ...EMPTY_SENTIMENT },
      confidence: "low",
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


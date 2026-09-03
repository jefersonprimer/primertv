import { prisma } from "@/lib/prisma";

export interface BayesianRatingResult {
  bayesianScore: number;
  weightedAverage: number;
  totalVotes: number;
  weightedVotes: number;
}

const MINIMUM_WEIGHTED_VOTES = 10;
const DEFAULT_GLOBAL_AVERAGE = 7.0;

/**
 * Calculates the Bayesian average rating for an anime, taking into account
 * vote weights (anti-review-bomb) and global baseline.
 *
 * Formula:
 * Score = (V / (V + M)) * R + (M / (V + M)) * C
 *
 * Where:
 * - R = Weighted real average of the item
 * - V = Total sum of vote weights for the item
 * - C = Global average rating across all ratings in the system
 * - M = Minimum confidence weight threshold (e.g. 10)
 */
export async function calculateAnimeBayesianScore(
  animeId: string
): Promise<BayesianRatingResult> {
  const [ratings, globalStats] = await Promise.all([
    prisma.animeRating.findMany({
      where: { animeId },
      select: { score: true, weight: true },
    }),
    prisma.animeRating.aggregate({
      _sum: { score: true, weight: true },
      _count: { id: true },
    }),
  ]);

  const totalVotes = ratings.length;

  if (totalVotes === 0) {
    return {
      bayesianScore: 0,
      weightedAverage: 0,
      totalVotes: 0,
      weightedVotes: 0,
    };
  }

  // Real weighted average R and weighted votes V
  let sumWeightedScores = 0;
  let weightedVotes = 0;

  for (const r of ratings) {
    const w = r.weight ?? 1.0;
    sumWeightedScores += r.score * w;
    weightedVotes += w;
  }

  const realWeightedAverage = weightedVotes > 0 ? sumWeightedScores / weightedVotes : 0;

  // Calculate Global Average C
  let globalAverage = DEFAULT_GLOBAL_AVERAGE;
  if (globalStats._count.id > 0 && globalStats._sum.score !== null) {
    globalAverage = globalStats._sum.score / globalStats._count.id;
  }

  const M = MINIMUM_WEIGHTED_VOTES;
  const C = globalAverage;
  const V = weightedVotes;
  const R = realWeightedAverage;

  // Bayesian Formula
  let bayesianScore = (V / (V + M)) * R + (M / (V + M)) * C;
  bayesianScore = Math.round(bayesianScore * 10) / 10;

  return {
    bayesianScore,
    weightedAverage: Math.round(realWeightedAverage * 10) / 10,
    totalVotes,
    weightedVotes: Math.round(weightedVotes * 10) / 10,
  };
}

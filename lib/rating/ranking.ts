import { prisma } from "@/lib/prisma";

export interface PlatformRatingEntry {
  animeId: string;
  /** Trust-weighted community average of the anime. */
  average: number;
  /** Amount of votes received by the anime. */
  votes: number;
  /** Position in the platform ranking (1 = best rated). */
  rank: number;
}

interface PlatformRatingRow {
  animeId: string;
  average: number | null;
  votes: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { expiresAt: number; entries: PlatformRatingEntry[] } | null = null;

/**
 * Returns every anime that has community votes, ordered by its community average.
 *
 * The average is trust-weighted, exactly like the real average used by the
 * Bayesian formula, so the ranking matches the score displayed to the user.
 * The result is cached for a few minutes because the ranking is platform wide
 * and only changes when somebody votes. Every number comes straight from the
 * `AnimeRating` table — nothing here is simulated.
 */
export async function getPlatformRatingRanking(): Promise<PlatformRatingEntry[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.entries;
  }

  const rows = await prisma.$queryRaw<PlatformRatingRow[]>`
    SELECT
      "animeId" AS "animeId",
      (SUM("score" * "weight") / NULLIF(SUM("weight"), 0))::float8 AS "average",
      COUNT(*)::int AS "votes"
    FROM "AnimeRating"
    GROUP BY "animeId"
  `;

  const entries: PlatformRatingEntry[] = rows
    .filter((row) => row.average !== null)
    .map((row) => ({
      animeId: row.animeId,
      average: row.average ?? 0,
      votes: row.votes,
      rank: 0,
    }))
    .sort((a, b) => b.average - a.average)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  cache = { expiresAt: Date.now() + CACHE_TTL_MS, entries };

  return entries;
}

import { prisma } from "@/lib/prisma";

export interface UserTrustDetails {
  accountAgeDays: number;
  weight: number;
  tier: "NEW" | "MATURING" | "ESTABLISHED" | "TRUSTED";
}

/**
 * Calculates the vote weight for a user based on account age and platform activity.
 *
 * Rules:
 * - < 1 day (24h): weight = 0.0 (Registered, but zero influence on global score)
 * - 1 to 7 days: weight = 0.25
 * - 7 to 30 days: weight = 0.50
 * - 30+ days: weight = 1.00
 * - 30+ days + regular activity (e.g. 5+ watch history or ratings): weight = 1.10 - 1.25
 */
export async function calculateUserVoteWeight(userId: string): Promise<UserTrustDetails> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      _count: {
        select: {
          watchHistory: true,
          animeRatings: true,
        },
      },
    },
  });

  if (!user) {
    return { accountAgeDays: 0, weight: 0.0, tier: "NEW" };
  }

  const now = new Date();
  const createdAt = new Date(user.createdAt);
  const diffMs = now.getTime() - createdAt.getTime();
  const accountAgeDays = diffMs / (1000 * 60 * 60 * 24);

  if (accountAgeDays < 1) {
    return { accountAgeDays, weight: 0.0, tier: "NEW" };
  }
  if (accountAgeDays < 7) {
    return { accountAgeDays, weight: 0.25, tier: "NEW" };
  }
  if (accountAgeDays < 30) {
    return { accountAgeDays, weight: 0.50, tier: "MATURING" };
  }

  // 30+ days
  const totalActivity = (user._count?.watchHistory ?? 0) + (user._count?.animeRatings ?? 0);
  let weight = 1.0;
  let tier: "ESTABLISHED" | "TRUSTED" = "ESTABLISHED";

  if (totalActivity >= 20) {
    weight = 1.25;
    tier = "TRUSTED";
  } else if (totalActivity >= 5) {
    weight = 1.1;
    tier = "TRUSTED";
  }

  return { accountAgeDays, weight, tier };
}

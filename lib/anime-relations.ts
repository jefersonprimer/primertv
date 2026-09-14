import { prisma } from "@/lib/prisma";

export type FranchiseItem = {
  id: string;
  slug: string;
  title: string;
  titleEnglish?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  rating?: string | null;
  duration?: string | null;
  score?: number | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
  firstEpisodeHref: string;
  firstEpisodeNumber?: number;
  totalEpisodes?: number;
  relationType: "sequel" | "prequel";
};

export type AnimeFranchise = {
  sequel: FranchiseItem | null;
  prequel: FranchiseItem | null;
};

export type DiscoveredRelations = {
  sequelMalId: number | null;
  prequelMalId: number | null;
  sequelAnilistId: number | null;
  prequelAnilistId: number | null;
};

// In-memory cache for franchise relations
const relationsCache = new Map<string, DiscoveredRelations & { timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function fetchAniListRelations({
  anilistId,
  malId,
}: {
  anilistId?: number | null;
  malId?: number | null;
}): Promise<DiscoveredRelations> {
  const cacheKey = `ani:${anilistId || ""}_mal:${malId || ""}`;
  const cached = relationsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      sequelMalId: cached.sequelMalId,
      prequelMalId: cached.prequelMalId,
      sequelAnilistId: cached.sequelAnilistId,
      prequelAnilistId: cached.prequelAnilistId,
    };
  }

  const query = `
    query ($id: Int, $idMal: Int) {
      Media(id: $id, idMal: $idMal, type: ANIME) {
        id
        idMal
        relations {
          edges {
            relationType
            node {
              id
              idMal
              type
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          id: anilistId || undefined,
          idMal: malId || undefined,
        },
      }),
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const json = await res.json();
      const media = json?.data?.Media;
      if (media?.relations?.edges) {
        let sequelMalId: number | null = null;
        let prequelMalId: number | null = null;
        let sequelAnilistId: number | null = null;
        let prequelAnilistId: number | null = null;

        for (const edge of media.relations.edges) {
          const relType = edge?.relationType;
          const node = edge?.node;
          if (node?.type !== "ANIME") continue;

          if (relType === "SEQUEL" && !sequelAnilistId) {
            sequelAnilistId = node.id || null;
            sequelMalId = node.idMal || null;
          } else if (relType === "PREQUEL" && !prequelAnilistId) {
            prequelAnilistId = node.id || null;
            prequelMalId = node.idMal || null;
          }
        }

        const result: DiscoveredRelations = {
          sequelMalId,
          prequelMalId,
          sequelAnilistId,
          prequelAnilistId,
        };

        relationsCache.set(cacheKey, { ...result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (error) {
    console.error("[fetchAniListRelations] Error:", error);
  }

  // Fallback to Jikan if AniList failed and malId exists
  if (malId) {
    const jikanRes = await fetchMalRelations(malId);
    return {
      sequelMalId: jikanRes.sequelMalId,
      prequelMalId: jikanRes.prequelMalId,
      sequelAnilistId: null,
      prequelAnilistId: null,
    };
  }

  return {
    sequelMalId: null,
    prequelMalId: null,
    sequelAnilistId: null,
    prequelAnilistId: null,
  };
}

export async function fetchMalRelations(malId: number): Promise<{
  sequelMalId: number | null;
  prequelMalId: number | null;
}> {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/relations`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return { sequelMalId: null, prequelMalId: null };
    }

    const json = await res.json();
    const relations = json.data || [];

    let sequelMalId: number | null = null;
    let prequelMalId: number | null = null;

    for (const rel of relations) {
      const relType = (rel.relation || "").toLowerCase();
      if (relType === "sequel" && !sequelMalId) {
        const entry = rel.entry?.find((e: any) => e.type?.toLowerCase() === "anime");
        if (entry?.mal_id) sequelMalId = entry.mal_id;
      } else if (relType === "prequel" && !prequelMalId) {
        const entry = rel.entry?.find((e: any) => e.type?.toLowerCase() === "anime");
        if (entry?.mal_id) prequelMalId = entry.mal_id;
      }
    }

    return { sequelMalId, prequelMalId };
  } catch (error) {
    console.error(`[fetchMalRelations] Error for MAL ID ${malId}:`, error);
    return { sequelMalId: null, prequelMalId: null };
  }
}

async function findFranchiseAnime({
  targetMalId,
  targetAnilistId,
  relationType,
}: {
  targetMalId?: number | null;
  targetAnilistId?: number | null;
  relationType: "sequel" | "prequel";
}): Promise<FranchiseItem | null> {
  const conditions = [
    targetAnilistId ? { anilistId: targetAnilistId } : undefined,
    targetMalId ? { malId: targetMalId } : undefined,
  ].filter(Boolean);

  if (conditions.length === 0) return null;

  const anime = await prisma.anime.findFirst({
    where: {
      OR: conditions as any,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      titleEnglish: true,
      imageUrl: true,
      bannerUrl: true,
      rating: true,
      duration: true,
      score: true,
      isDubbed: true,
      isSubtitled: true,
      seasons: {
        orderBy: { number: "asc" },
        take: 1,
        select: {
          number: true,
          episodes: {
            orderBy: { number: "asc" },
            take: 1,
            select: {
              id: true,
              number: true,
              publicId: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!anime) return null;

  const firstSeason = anime.seasons[0];
  const firstEp = firstSeason?.episodes[0];

  let firstEpisodeHref = `/animes/${anime.slug}`;
  let firstEpisodeNumber: number | undefined;

  if (firstEp) {
    firstEpisodeHref = firstEp.publicId
      ? `/watch/${firstEp.publicId}/${firstEp.slug || `episode-${firstEp.number}`}`
      : `/watch/${firstEp.id}/${firstEp.slug || `episode-${firstEp.number}`}`;
    firstEpisodeNumber = firstEp.number;
  } else {
    // Megaplay fallback route if anime has external catalog
    firstEpisodeHref = `/watch/${anime.slug}/episode-1?source=megaplay&episode=1&season=1`;
    firstEpisodeNumber = 1;
  }

  return {
    id: anime.id,
    slug: anime.slug,
    title: anime.title,
    titleEnglish: anime.titleEnglish,
    imageUrl: anime.imageUrl,
    bannerUrl: anime.bannerUrl,
    rating: anime.rating,
    duration: anime.duration,
    score: anime.score,
    isDubbed: anime.isDubbed,
    isSubtitled: anime.isSubtitled,
    firstEpisodeHref,
    firstEpisodeNumber,
    relationType,
  };
}

export async function resolveAnimeFranchise({
  animeId,
  malId,
  anilistId,
  sequelMalId,
  prequelMalId,
  sequelAnilistId,
  prequelAnilistId,
}: {
  animeId?: string;
  malId?: number | null;
  anilistId?: number | null;
  sequelMalId?: number | null;
  prequelMalId?: number | null;
  sequelAnilistId?: number | null;
  prequelAnilistId?: number | null;
}): Promise<AnimeFranchise> {
  let targetSequelMalId = sequelMalId ?? null;
  let targetPrequelMalId = prequelMalId ?? null;
  let targetSequelAnilistId = sequelAnilistId ?? null;
  let targetPrequelAnilistId = prequelAnilistId ?? null;

  // Auto-detect relations if not fully provided
  const needsSequel = !targetSequelMalId && !targetSequelAnilistId;
  const needsPrequel = !targetPrequelMalId && !targetPrequelAnilistId;

  if ((needsSequel || needsPrequel) && (anilistId || malId)) {
    const discovered = await fetchAniListRelations({ anilistId, malId });

    if (needsSequel) {
      targetSequelMalId = discovered.sequelMalId;
      targetSequelAnilistId = discovered.sequelAnilistId;
    }
    if (needsPrequel) {
      targetPrequelMalId = discovered.prequelMalId;
      targetPrequelAnilistId = discovered.prequelAnilistId;
    }

    // Opportunistically persist discovered IDs to the database
    if (
      animeId &&
      (discovered.sequelMalId ||
        discovered.prequelMalId ||
        discovered.sequelAnilistId ||
        discovered.prequelAnilistId)
    ) {
      prisma.anime
        .update({
          where: { id: animeId },
          data: {
            sequelMalId: targetSequelMalId ?? undefined,
            prequelMalId: targetPrequelMalId ?? undefined,
            sequelAnilistId: targetSequelAnilistId ?? undefined,
            prequelAnilistId: targetPrequelAnilistId ?? undefined,
          },
        })
        .catch(() => {});
    }
  }

  const [sequel, prequel] = await Promise.all([
    targetSequelMalId || targetSequelAnilistId
      ? findFranchiseAnime({
          targetMalId: targetSequelMalId,
          targetAnilistId: targetSequelAnilistId,
          relationType: "sequel",
        })
      : Promise.resolve(null),
    targetPrequelMalId || targetPrequelAnilistId
      ? findFranchiseAnime({
          targetMalId: targetPrequelMalId,
          targetAnilistId: targetPrequelAnilistId,
          relationType: "prequel",
        })
      : Promise.resolve(null),
  ]);

  return { sequel, prequel };
}

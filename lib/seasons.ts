/**
 * Utility functions for managing seasons.
 */

export interface SeasonInfo {
  season: string;
  year: number;
  label: string;
  slug: string;
}

/**
 * Normalizes and parses the season and year from an anime's premiered or aired field.
 */
export function parseSeasonAndYear(
  season: string | null | undefined,
  year: number | null | undefined,
  aired?: string | null | undefined
): { season: string; year: number } | null {
  if (season && year) {
    const s = season.toLowerCase().trim();
    if (["winter", "spring", "summer", "fall"].includes(s)) {
      return { season: s, year };
    }
  }

  if (aired) {
    // Examples:
    // "Oct 3, 2002 to Feb 8, 2007"
    // "Jul 8, 2026 to ?"
    // "Apr 2009"
    // "2009"
    const startPart = aired.split(" to ")[0].trim();
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const lowerStart = startPart.toLowerCase();

    let matchedMonth = -1;
    for (let i = 0; i < months.length; i++) {
      if (lowerStart.includes(months[i])) {
        matchedMonth = i;
        break;
      }
    }

    const yearMatch = startPart.match(/\b\d{4}\b/);
    if (yearMatch) {
      const y = parseInt(yearMatch[0], 10);
      let s = "";
      if (matchedMonth !== -1) {
        if (matchedMonth >= 0 && matchedMonth <= 2) s = "winter";
        else if (matchedMonth >= 3 && matchedMonth <= 5) s = "spring";
        else if (matchedMonth >= 6 && matchedMonth <= 8) s = "summer";
        else if (matchedMonth >= 9 && matchedMonth <= 11) s = "fall";
      } else {
        // Default to winter if only year is available
        s = "winter";
      }
      return { season: s, year: y };
    }
  }

  return null;
}

/**
 * Calculates the current season slug (e.g., "summer-2026") based on the current date.
 * Shifts to the next season in the second half of the transition month.
 */
export function getCurrentSeasonSlug(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 = Jan, 11 = Dec

  let season = "winter";
  let seasonYear = year;

  // Transition bounds:
  // Dec 15 -> Winter of next year
  // Mar 15 -> Spring of current year
  // Jun 15 -> Summer of current year
  // Sep 15 -> Fall of current year
  if (month === 11 && now.getDate() >= 15) {
    season = "winter";
    seasonYear = year + 1;
  } else if (month === 2 && now.getDate() >= 15) {
    season = "spring";
  } else if (month === 5 && now.getDate() >= 15) {
    season = "summer";
  } else if (month === 8 && now.getDate() >= 15) {
    season = "fall";
  } else if (month >= 0 && month <= 2) {
    season = "winter";
  } else if (month >= 3 && month <= 5) {
    season = "spring";
  } else if (month >= 6 && month <= 8) {
    season = "summer";
  } else if (month >= 9 && month <= 11) {
    season = "fall";
  }

  return `${season}-${seasonYear}`;
}

/**
 * Compiles a sorted list of unique seasons from animes, combining default seasons around the current year.
 */
export function getUniqueSeasons(animes: { season?: string | null; year?: number | null; aired?: string | null }[]): SeasonInfo[] {
  const seasonsMap = new Map<string, SeasonInfo>();
  const current = new Date();
  const currentYear = current.getFullYear();
  const seasonsList = ["winter", "spring", "summer", "fall"];

  // Populate dynamic default range (2 years back, 1 year forward)
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    for (const s of seasonsList) {
      const label = `${s.charAt(0).toUpperCase() + s.slice(1)} ${y}`;
      const slug = `${s}-${y}`;
      seasonsMap.set(slug, { season: s, year: y, label, slug });
    }
  }

  // Populate actual parsed seasons from data
  for (const anime of animes) {
    const info = parseSeasonAndYear(anime.season, anime.year, anime.aired);
    if (info) {
      const { season, year } = info;
      const slug = `${season}-${year}`;
      const label = `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`;
      seasonsMap.set(slug, { season, year, label, slug });
    }
  }

  // Sort chronological descending (newest first, then fall > summer > spring > winter)
  const seasonOrder: Record<string, number> = { fall: 4, summer: 3, spring: 2, winter: 1 };

  return Array.from(seasonsMap.values()).sort((a, b) => {
    if (b.year !== a.year) {
      return b.year - a.year;
    }
    return (seasonOrder[b.season] || 0) - (seasonOrder[a.season] || 0);
  });
}

import { getMegaPlayAnimeCatalog } from "@/lib/anikoto";

export type LocalSeasonForMerge = {
  id: string;
  number: number;
  title?: string | null;
  anilistId?: number | null;
  malId?: number | null;
  episodes: Array<{
    id: string;
    number: number;
    title: string | null;
    slug: string | null;
    publicId: string | null;
    videoUrl: string | null;
    imageUrl: string | null;
    createdAt?: Date | null;
  }>;
};

export type MergedEpisode = {
  id: string;
  number: number;
  title: string | null;
  href: string;
  videoUrl: string | null;
  imageUrl: string | null;
  publicId: string | null;
  slug: string | null;
  createdAt?: Date | null;
};

export type MergedSeason = {
  id: string;
  number: number;
  title?: string | null;
  episodes: MergedEpisode[];
};

export async function buildMergedSeasons({
  animeSlug,
  animeTitle,
  animeAnilistId,
  animeMalId,
  animeTitleEnglish,
  localSeasons,
  translateEpisode,
}: {
  animeSlug: string;
  animeTitle: string;
  animeAnilistId?: number | null;
  animeMalId?: number | null;
  animeTitleEnglish?: string | null;
  localSeasons: LocalSeasonForMerge[];
  translateEpisode?: (num: number) => string;
}): Promise<MergedSeason[]> {
  const seasonsToProcess =
    localSeasons.length > 0
      ? localSeasons
      : [
          {
            id: "megaplay-season-1",
            number: 1,
            title: null,
            anilistId: animeAnilistId,
            malId: animeMalId,
            episodes: [],
          },
        ];

  const defaultTranslate = (num: number) => `Episódio ${num}`;
  const getEpText = translateEpisode || defaultTranslate;

  const mergedSeasons: MergedSeason[] = await Promise.all(
    seasonsToProcess.map(async (season) => {
      const seasonSourceKey = JSON.stringify({
        anilistId: animeAnilistId,
        malId: animeMalId,
        seasonAnilistId: season.anilistId,
        seasonMalId: season.malId,
        title: season.title ? `${animeTitle} ${season.title}` : animeTitle,
        titleEnglish: animeTitleEnglish,
        slug: animeSlug,
        seasonNumber: season.number,
      });

      const externalCatalog = await getMegaPlayAnimeCatalog(seasonSourceKey);
      const externalEpisodes = externalCatalog?.episodes || [];

      const localEpNumbers = new Set(
        season.episodes.map((episode) => episode.number),
      );

      const mergedEpisodes: MergedEpisode[] = [...season.episodes]
        .sort((a, b) => a.number - b.number)
        .map((episode) => ({
          id: episode.id,
          number: episode.number,
          title: episode.title,
          href: episode.publicId
            ? `/watch/${episode.publicId}/${episode.slug || "episode-" + episode.number}`
            : `/watch/${episode.id}/${episode.slug || "episode-" + episode.number}`,
          videoUrl: episode.videoUrl,
          imageUrl: episode.imageUrl,
          publicId: episode.publicId,
          slug: episode.slug,
          createdAt: episode.createdAt,
        }));

      for (const extEp of externalEpisodes) {
        if (localEpNumbers.has(extEp.number)) {
          continue;
        }
        mergedEpisodes.push({
          id: `megaplay-s${season.number}-${extEp.number}`,
          number: extEp.number,
          title: extEp.title || `${animeTitle} - ${getEpText(extEp.number)}`,
          href: `/watch/${animeSlug}/episode-${extEp.number}?source=megaplay&episode=${extEp.number}&season=${season.number}`,
          videoUrl: `/watch/${animeSlug}/episode-${extEp.number}?source=megaplay&episode=${extEp.number}&season=${season.number}`,
          imageUrl: null,
          publicId: null,
          slug: `episode-${extEp.number}`,
        });
      }

      mergedEpisodes.sort((a, b) => a.number - b.number);

      return {
        id: season.id,
        number: season.number,
        title: season.title,
        episodes: mergedEpisodes,
      };
    }),
  );

  return mergedSeasons
    .filter((season) => season.episodes.length > 0)
    .sort((a, b) => a.number - b.number);
}

import { Prisma } from "@prisma/client";
import { getAnimeScheduleRows } from "@/lib/anime-schedule";
import { TodayReleasesClient } from "./TodayReleasesClient";

type TodayReleaseAnime = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  rating: string | null;
  releaseDay: number;
  releaseTime: string;
  lastEpisode: number;
  latestEpisodeId: string | null;
  latestEpisodePublicId: string | null;
  latestEpisodeSlug: string | null;
  episodeImageUrl: string | null;
  episodeNumbers: number[];
};

function getSaoPauloDateKey(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function getDeterministicDay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 7;
}

function formatReleaseTime(date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(date).toLowerCase();
  } catch {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  }
}

export async function TodayReleases() {
  const rows = await getAnimeScheduleRows({
    limit: 100,
    whereSql: Prisma.sql`
      a."status" = 'Currently Airing'
      OR a."status" = 'Not yet aired'
      OR a."status" IS NULL
    `,
  });

  const animeMap = new Map<
    string,
    TodayReleaseAnime & {
      latestEpisodeAt: Date | null;
      episodeCreatedAtEntries: Array<{ number: number; createdAt: Date }>;
    }
  >();

  for (const row of rows) {
    const existing = animeMap.get(row.id);
    if (!existing) {
      const latestEpisodeAt = row.latestEpisodeAt ?? null;
      animeMap.set(row.id, {
        id: row.id,
        slug: row.slug,
        title: row.title,
        imageUrl: row.imageUrl,
        bannerUrl: row.bannerUrl === "none" ? null : row.bannerUrl,
        description: row.description,
        rating: row.rating,
        releaseDay: latestEpisodeAt ? latestEpisodeAt.getDay() : getDeterministicDay(row.id),
        releaseTime: latestEpisodeAt ? formatReleaseTime(latestEpisodeAt) : "6:00am",
        lastEpisode: row.latestEpisodeNumber ?? row.episodeNumber ?? 20,
        latestEpisodeId: row.latestEpisodeId ?? row.episodeId,
        latestEpisodePublicId: row.episodePublicId,
        latestEpisodeSlug: row.episodeSlug,
        episodeImageUrl: row.episodeImageUrl,
        episodeNumbers: row.episodeNumber !== null ? [row.episodeNumber] : [],
        latestEpisodeAt,
        episodeCreatedAtEntries:
          row.episodeNumber !== null && row.episodeCreatedAt
            ? [{ number: row.episodeNumber, createdAt: row.episodeCreatedAt }]
            : [],
      });
      continue;
    }

    if (row.episodeNumber !== null) {
      existing.episodeNumbers.push(row.episodeNumber);
      if (row.episodeCreatedAt) {
        existing.episodeCreatedAtEntries.push({
          number: row.episodeNumber,
          createdAt: row.episodeCreatedAt,
        });
      }

      const candidateNumber = row.latestEpisodeNumber ?? row.episodeNumber;
      if (candidateNumber > existing.lastEpisode) {
        existing.lastEpisode = candidateNumber;
        existing.latestEpisodeId = row.latestEpisodeId ?? row.episodeId;
        existing.latestEpisodePublicId = row.episodePublicId;
        existing.latestEpisodeSlug = row.episodeSlug;
        existing.episodeImageUrl = row.episodeImageUrl;
      }
    }
  }

  const processedDbAnimes = Array.from(animeMap.values()).map((anime) => {
    const releaseDateKey = anime.latestEpisodeAt
      ? getSaoPauloDateKey(anime.latestEpisodeAt)
      : null;
    const sameDayEpisodes = releaseDateKey
      ? anime.episodeCreatedAtEntries.filter(
          (ep) => getSaoPauloDateKey(ep.createdAt) === releaseDateKey,
        )
      : anime.episodeCreatedAtEntries;

    return {
      id: anime.id,
      slug: anime.slug,
      title: anime.title,
      imageUrl: anime.imageUrl,
      bannerUrl: anime.bannerUrl,
      description: anime.description,
      rating: anime.rating,
      releaseDay: anime.releaseDay,
      releaseTime: anime.releaseTime,
      lastEpisode: anime.lastEpisode,
      latestEpisodeId: anime.latestEpisodeId,
      latestEpisodePublicId: anime.latestEpisodePublicId,
      latestEpisodeSlug: anime.latestEpisodeSlug,
      episodeImageUrl: anime.episodeImageUrl,
      episodeNumbers: sameDayEpisodes.map((ep) => ep.number),
      latestEpisodeAt: anime.latestEpisodeAt,
    };
  });

  const now = new Date();
  const todayKey = getSaoPauloDateKey(now);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = getSaoPauloDateKey(yesterday);
  const dayBeforeYesterday = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const dayBeforeYesterdayKey = getSaoPauloDateKey(dayBeforeYesterday);

  const filteredDbAnimes = processedDbAnimes.filter((anime) => {
    if (!anime.latestEpisodeAt) return false;
    const dateKey = getSaoPauloDateKey(anime.latestEpisodeAt);
    return (
      dateKey === todayKey ||
      dateKey === yesterdayKey ||
      dateKey === dayBeforeYesterdayKey
    );
  });

  let currentDay = new Date().getDay();
  try {
    const spDateStr = new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    });
    currentDay = new Date(spDateStr).getDay();
  } catch {
    currentDay = new Date().getDay();
  }

  return <TodayReleasesClient animes={filteredDbAnimes} serverCurrentDay={currentDay} />;
}

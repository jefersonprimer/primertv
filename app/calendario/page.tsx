import { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { CalendarView } from "@/components/CalendarView";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { getAnimeScheduleRows } from "@/lib/anime-schedule";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calendário de Animes - PrimerTv",
  description:
    "Acompanhe os dias de exibição e horários de lançamento dos novos episódios dos seus animes favoritos.",
};

type CalendarAnimeItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  description: string | null;
  releaseDay: number;
  releaseTime: string;
  lastEpisode: number;
  latestEpisodeId: string | null;
  latestEpisodePublicId?: string | null;
  latestEpisodeSlug?: string | null;
  episodeImageUrl: string | null;
  inWatchlist: boolean;
  episodeNumbers: number[];
  isComingSoon: boolean;
};

function getDeterministicDay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 7;
}

const dayMap: Record<string, number> = {
  sunday: 0,
  sundays: 0,
  monday: 1,
  mondays: 1,
  tuesday: 2,
  tuesdays: 2,
  wednesday: 3,
  wednesdays: 3,
  thursday: 4,
  thursdays: 4,
  friday: 5,
  fridays: 5,
  saturday: 6,
  saturdays: 6,
};

function parseBroadcastToBrasilia(
  broadcastDay: string | null,
  broadcastTime: string | null,
): { releaseDay: number; releaseTime: string } | null {
  if (!broadcastDay || !broadcastTime) return null;

  const baseDay = dayMap[broadcastDay.toLowerCase().trim()];
  if (baseDay === undefined) return null;

  const timeParts = broadcastTime.trim().split(":");
  if (timeParts.length < 2) return null;

  const jstHour = parseInt(timeParts[0], 10);
  const jstMinute = parseInt(timeParts[1], 10);
  if (isNaN(jstHour) || isNaN(jstMinute)) return null;

  let brHour = jstHour - 12;
  let brDay = baseDay;
  if (brHour < 0) {
    brHour += 24;
    brDay = (brDay - 1 + 7) % 7;
  }

  const ampm = brHour >= 12 ? "pm" : "am";
  const displayHour = brHour % 12 === 0 ? 12 : brHour % 12;
  const minStr = jstMinute < 10 ? "0" + jstMinute : jstMinute;

  return { releaseDay: brDay, releaseTime: `${displayHour}:${minStr} ${ampm}` };
}

function formatReleaseTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .toLowerCase();
  } catch {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${hours}:${minutes < 10 ? `0${minutes}` : minutes} ${ampm}`;
  }
}

export default async function CalendarioPage() {
  const userId = await getAuthenticatedUserId();

  const [watchlistItems, rows] = await Promise.all([
    userId
      ? prisma.watchlistItem.findMany({
          where: { userId, mediaType: "ANIME" },
          select: { animeId: true },
        })
      : Promise.resolve([]),
    getAnimeScheduleRows({
      limit: 200,
      whereSql: Prisma.sql`
        a."status" = 'Currently Airing'
        OR a."status" = 'Not yet aired'
        OR a."status" IS NULL
      `,
    }),
  ]);

  const watchlistIds = new Set(
    watchlistItems.map((item) => item.animeId).filter(Boolean),
  );

  const animeMap = new Map<string, CalendarAnimeItem>();

  for (const row of rows) {
    const latestEpisodeAt = row.latestEpisodeAt ?? row.episodeCreatedAt ?? null;
    const releaseDay = latestEpisodeAt
      ? latestEpisodeAt.getDay()
      : getDeterministicDay(row.id);
    const releaseTime = latestEpisodeAt
      ? formatReleaseTime(latestEpisodeAt)
      : "6:00 am";

    const officialSchedule = parseBroadcastToBrasilia(
      row.broadcastDay,
      row.broadcastTime,
    );

    const existing = animeMap.get(row.id);
    if (!existing) {
      animeMap.set(row.id, {
        id: row.id,
        slug: row.slug,
        title: row.title,
        imageUrl: row.imageUrl,
        description: row.description,
        releaseDay: officialSchedule?.releaseDay ?? releaseDay,
        releaseTime: officialSchedule?.releaseTime ?? releaseTime,
        lastEpisode: row.latestEpisodeNumber ?? row.episodeNumber ?? 20,
        latestEpisodeId: row.latestEpisodeId ?? row.episodeId,
        latestEpisodePublicId: row.episodePublicId,
        latestEpisodeSlug: row.episodeSlug,
        episodeImageUrl: row.episodeImageUrl,
        inWatchlist: watchlistIds.has(row.id),
        episodeNumbers: row.episodeNumber !== null ? [row.episodeNumber] : [],
        isComingSoon: row.latestEpisodeNumber == null && row.episodeNumber == null,
      });
      continue;
    }

    if (row.episodeNumber !== null) {
      existing.episodeNumbers.push(row.episodeNumber);
      const candidateNumber = row.latestEpisodeNumber ?? row.episodeNumber;
      if (candidateNumber > existing.lastEpisode) {
        existing.lastEpisode = candidateNumber;
        existing.latestEpisodeId = row.latestEpisodeId ?? row.episodeId;
        existing.latestEpisodePublicId = row.episodePublicId;
        existing.latestEpisodeSlug = row.episodeSlug;
        existing.episodeImageUrl = row.episodeImageUrl;
      }
      existing.releaseDay = officialSchedule?.releaseDay ?? releaseDay;
      existing.releaseTime = officialSchedule?.releaseTime ?? releaseTime;
    }
  }

  const processedDbAnimes = Array.from(animeMap.values());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CalendarView animes={processedDbAnimes} isLoggedIn={Boolean(userId)} />
    </div>
  );
}

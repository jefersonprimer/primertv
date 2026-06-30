import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/CalendarView";
import { Metadata } from "next";
import { getAuthenticatedUserId } from "@/lib/watchlist";

export const revalidate = 3600; // Revalida a cada hora

export const metadata: Metadata = {
  title: "Calendário de Animes - PrimerTv",
  description: "Acompanhe os dias de exibição e horários de lançamento dos novos episódios dos seus animes favoritos.",
};

// Deterministic day assignment helper
function getDeterministicDay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 7;
}

const dayMap: Record<string, number> = {
  sunday: 0, sundays: 0,
  monday: 1, mondays: 1,
  tuesday: 2, tuesdays: 2,
  wednesday: 3, wednesdays: 3,
  thursday: 4, thursdays: 4,
  friday: 5, fridays: 5,
  saturday: 6, saturdays: 6,
};

function parseBroadcastToBrasilia(
  broadcastDay: string | null,
  broadcastTime: string | null
): { releaseDay: number; releaseTime: string } | null {
  if (!broadcastDay || !broadcastTime) return null;

  const cleanDay = broadcastDay.toLowerCase().trim();
  let baseDay = dayMap[cleanDay];
  if (baseDay === undefined) return null;

  const timeParts = broadcastTime.trim().split(":");
  if (timeParts.length < 2) return null;

  const jstHour = parseInt(timeParts[0], 10);
  const jstMinute = parseInt(timeParts[1], 10);
  if (isNaN(jstHour) || isNaN(jstMinute)) return null;

  // JST (UTC+9) is 12 hours ahead of America/Sao_Paulo (UTC-3)
  // Therefore, Brasília time = JST time - 12 hours.
  let brHour = jstHour - 12;
  let brDay = baseDay;

  if (brHour < 0) {
    brHour += 24;
    brDay = (brDay - 1 + 7) % 7;
  }

  // Format releaseTime as am/pm (e.g. "9:30 am" or "12:30 pm")
  const ampm = brHour >= 12 ? "pm" : "am";
  const displayHour = brHour % 12 === 0 ? 12 : brHour % 12;
  const minStr = jstMinute < 10 ? "0" + jstMinute : jstMinute;
  const releaseTime = `${displayHour}:${minStr} ${ampm}`;

  return { releaseDay: brDay, releaseTime };
}

export default async function CalendarioPage() {
  // Check if user is logged in and fetch their watchlist
  const userId = await getAuthenticatedUserId();
  const watchlistItems = userId
    ? await prisma.watchlistItem.findMany({
        where: { userId, mediaType: "ANIME" },
        select: { animeId: true },
      })
    : [];
  const watchlistIds = new Set(watchlistItems.map((item) => item.animeId).filter(Boolean));

  // Fetch real animes from the database
  const dbAnimes = await prisma.anime.findMany({
    where: {
      OR: [
        { status: "Currently Airing" },
        { status: "Not yet aired" },
        { status: null },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      description: true,
      aired: true,
      status: true,
      broadcastDay: true,
      broadcastTime: true,
      broadcastTimezone: true,
      broadcastString: true,
      seasons: {
        select: {
          episodes: {
            select: {
              id: true,
              number: true,
              imageUrl: true,
              createdAt: true,
            },
            orderBy: {
              number: "asc",
            },
          },
        },
        orderBy: {
          number: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map database entries to match the AnimeItem interface
  const processedDbAnimes = dbAnimes.map((anime) => {
    let releaseDay = getDeterministicDay(anime.id);
    let releaseTime = "6:00 am";
    let lastEp = 20;
    let latestEpisodeId: string | null = null;
    let episodeImageUrl: string | null = null;
    let isComingSoon = false;

    const latestSeason = anime.seasons?.[0];
    const episodes = latestSeason?.episodes || [];
    const latestEpisode = episodes[episodes.length - 1];

    if (latestEpisode) {
      latestEpisodeId = latestEpisode.id;
      lastEp = latestEpisode.number;
      episodeImageUrl = latestEpisode.imageUrl;
      const date = new Date(latestEpisode.createdAt);
      
      // Define o dia da semana baseado na data do último episódio criado
      releaseDay = date.getDay();
      
      // Formata o horário exato baseado na data do último episódio criado
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Sao_Paulo",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        releaseTime = formatter.format(date).toLowerCase();
      } catch (e) {
        // Fallback em caso de erro ao formatar timezone
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minStr = minutes < 10 ? "0" + minutes : minutes;
        releaseTime = `${hours}:${minStr} ${ampm}`;
      }
    } else {
      isComingSoon = true;
      lastEp = 1;
      
      // Tenta decodificar o dia da semana baseado na data de estreia (aired)
      if (anime.aired) {
        const startPart = anime.aired.split(" to ")[0].trim();
        const date = new Date(startPart);
        if (!isNaN(date.getTime())) {
          releaseDay = date.getDay();
        }
      }

      // Fallback determinístico caso o anime não possua nenhum episódio cadastrado
      const idHash = anime.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fallbackHours = [6, 9, 14, 18];
      const selectedHour = fallbackHours[idHash % fallbackHours.length];
      const ampm = selectedHour >= 12 ? "pm" : "am";
      const displayHour = selectedHour > 12 ? selectedHour - 12 : selectedHour;
      releaseTime = `${displayHour}:00 ${ampm}`;
    }

    // Sobrescreve com o cronograma de transmissão oficial se disponível (convertido de JST para Brasília)
    const officialSchedule = parseBroadcastToBrasilia(anime.broadcastDay, anime.broadcastTime);
    if (officialSchedule) {
      releaseDay = officialSchedule.releaseDay;
      releaseTime = officialSchedule.releaseTime;
    }

    const episodeNumbers = episodes.map((ep) => ep.number);

    return {
      id: anime.id,
      slug: anime.slug,
      title: anime.title,
      imageUrl: anime.imageUrl,
      description: anime.description,
      releaseDay,
      releaseTime,
      lastEpisode: lastEp,
      latestEpisodeId,
      episodeImageUrl,
      inWatchlist: watchlistIds.has(anime.id),
      episodeNumbers,
      isComingSoon,
    };
  });

  // Obter o dia da semana atual no fuso horário de Brasília (UTC-3)
  let currentDay = new Date().getDay();
  try {
    const spDateStr = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    currentDay = new Date(spDateStr).getDay();
  } catch (e) {
    currentDay = new Date().getDay();
  }

  // Mostrar todos os animes do calendário semanal, sem limitar ao dia atual
  const filteredDbAnimes = processedDbAnimes;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CalendarView animes={filteredDbAnimes} isLoggedIn={Boolean(userId)} />
    </div>
  );
}

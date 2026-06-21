import { prisma } from "@/lib/prisma";
import { TodayReleasesClient } from "./TodayReleasesClient";

// Deterministic day assignment helper
function getDeterministicDay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 7;
}

export async function TodayReleases() {
  // Fetch animes from the database
  const dbAnimes = await prisma.anime.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      description: true,
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

  // Process data to calculate releaseDay and releaseTime
  const processedDbAnimes = dbAnimes.map((anime) => {
    let releaseDay = getDeterministicDay(anime.id);
    let releaseTime = "6:00am";
    let lastEp = 20;
    let latestEpisodeId: string | null = null;
    let episodeImageUrl: string | null = null;

    const latestSeason = anime.seasons?.[0];
    const episodes = latestSeason?.episodes || [];
    const latestEpisode = episodes[episodes.length - 1];

    if (latestEpisode) {
      latestEpisodeId = latestEpisode.id;
      lastEp = latestEpisode.number;
      episodeImageUrl = latestEpisode.imageUrl;
      const date = new Date(latestEpisode.createdAt);

      // Release day based on the creation date of the latest episode
      releaseDay = date.getDay();

      // Release time formatted based on Sao Paulo timezone
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Sao_Paulo",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        releaseTime = formatter.format(date).toLowerCase();
      } catch (e) {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minStr = minutes < 10 ? "0" + minutes : minutes;
        releaseTime = `${hours}:${minStr} ${ampm}`;
      }
    } else {
      // Fallback if no episodes are loaded
      const idHash = anime.id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      lastEp = idHash % 2 === 0 ? 20 : 10;

      const fallbackHours = [6, 9, 14, 18];
      const selectedHour = fallbackHours[idHash % fallbackHours.length];
      const ampm = selectedHour >= 12 ? "pm" : "am";
      const displayHour = selectedHour > 12 ? selectedHour - 12 : selectedHour;
      releaseTime = `${displayHour}:00 ${ampm}`;
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
      episodeNumbers,
    };
  });

  // Obter o dia da semana atual no fuso horário de Brasília (UTC-3)
  let currentDay = new Date().getDay();
  try {
    const spDateStr = new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
    });
    currentDay = new Date(spDateStr).getDay();
  } catch (e) {
    currentDay = new Date().getDay();
  }

  // Filtrar para mostrar apenas os animes que já foram lançados nesta semana (até o dia atual)
  const filteredDbAnimes = processedDbAnimes.filter(
    (anime) => anime.releaseDay <= currentDay,
  );

  return <TodayReleasesClient animes={filteredDbAnimes} />;
}

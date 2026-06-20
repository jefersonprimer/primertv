import { prisma } from "@/lib/prisma";
import { TodayReleasesClient } from "./TodayReleasesClient";

// Helper to assign a deterministic day if anime has no episodes
function getDeterministicDay(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 7;
}

// Fallback high-quality anime list to match Calendar page
const MOCK_ANIME_FALLBACKS = [
  {
    id: "fallback-1",
    slug: "one-piece",
    title: "One Piece",
    description: "Luffy e sua tripulação navegam pelos oceanos em busca do lendário tesouro One Piece, enfrentando inimigos poderosos e fazendo grandes aliados para que Luffy se torne o Rei dos Piratas.",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
    releaseDay: 0, // Domingo
    releaseTime: "6:00 am",
    lastEpisode: 20,
    latestEpisodeId: null,
    inWatchlist: false,
  },
  {
    id: "fallback-2",
    slug: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    description: "Sofrimento, arrependimento, vergonha: os sentimentos negativos humanos tornam-se Maldições, assolando o cotidiano das pessoas. Para salvar um amigo, Yuji Itadori acaba engolindo o dedo da Maldição de nível especial e assume a sua alma.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    releaseDay: 1, // Segunda
    releaseTime: "6:00 am",
    lastEpisode: 10,
    latestEpisodeId: null,
    inWatchlist: false,
  },
  {
    id: "fallback-3",
    slug: "demon-slayer",
    title: "Demon Slayer: Kimetsu no Yaiba",
    description: "Tanjirou Kamado luta incansavelmente para curar sua irmã Nezuko, que foi transformada em demônio (oni), e vingar a morte trágica de sua família juntando-se à corporação dos Exterminadores de Demônios.",
    imageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    releaseDay: 2, // Terça
    releaseTime: "6:00 am",
    lastEpisode: 20,
    latestEpisodeId: null,
    inWatchlist: false,
  },
  {
    id: "fallback-4",
    slug: "chainsaw-man",
    title: "Chainsaw Man",
    description: "Denji é um jovem pobre que faz qualquer coisa por dinheiro, até caçar demônios com seu cachorro-demônio Pochita. Após ser traído e morto, ele se funde com Pochita e renasce como o Homem-Motosserra.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    releaseDay: 3, // Quarta
    releaseTime: "6:00 am",
    lastEpisode: 10,
    latestEpisodeId: null,
    inWatchlist: false,
  },
  {
    id: "fallback-5",
    slug: "frieren",
    title: "Frieren: Beyond Journey's End",
    description: "A maga elfa Frieren e seus corajosos companheiros derrotaram o Rei Demônio e trouxeram paz ao reino. Após a jornada, Frieren deve encarar a passagem do tempo e as memórias da sua vida de quase imortal.",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
    releaseDay: 4, // Quinta
    releaseTime: "6:00 am",
    lastEpisode: 20,
    latestEpisodeId: null,
    inWatchlist: false,
  },
  {
    id: "fallback-6",
    slug: "solo-leveling",
    title: "Solo Leveling",
    description: "Em um mundo onde caçadores lutam contra monstros invasores, Sung Jin-woo é o caçador mais fraco de todos. Mas após sobreviver a uma masmorra dupla mortal, ele ganha uma habilidade única de subir de nível sem limites.",
    imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
    releaseDay: 5, // Sexta
    releaseTime: "6:00 am",
    lastEpisode: 10,
    latestEpisodeId: null,
    inWatchlist: false,
  },
  {
    id: "fallback-7",
    slug: "attack-on-titan",
    title: "Attack on Titan",
    description: "Eren Yeager prometeu exterminar até o último Titã da Terra após presenciar a destruição de sua cidade natal e a morte de sua mãe por essas criaturas gigantescas.",
    imageUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
    episodeImageUrl: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&auto=format&fit=crop&q=80",
    releaseDay: 6, // Sábado
    releaseTime: "6:00 am",
    lastEpisode: 20,
    latestEpisodeId: null,
    inWatchlist: false,
  }
];

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
              number: "desc",
            },
            take: 1,
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
    let releaseTime = "6:00 am";
    let lastEp = 20;
    let latestEpisodeId: string | null = null;
    let episodeImageUrl: string | null = null;

    const latestSeason = anime.seasons?.[0];
    const latestEpisode = latestSeason?.episodes?.[0];

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
      const idHash = anime.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      lastEp = idHash % 2 === 0 ? 20 : 10;
      
      const fallbackHours = [6, 9, 14, 18];
      const selectedHour = fallbackHours[idHash % fallbackHours.length];
      const ampm = selectedHour >= 12 ? "pm" : "am";
      const displayHour = selectedHour > 12 ? selectedHour - 12 : selectedHour;
      releaseTime = `${displayHour}:00 ${ampm}`;
    }

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
    };
  });

  // Merge database with fallbacks
  const finalAnimes = [...processedDbAnimes];
  MOCK_ANIME_FALLBACKS.forEach((fallback) => {
    if (!finalAnimes.some((a) => a.slug === fallback.slug)) {
      finalAnimes.push(fallback);
    }
  });

  return <TodayReleasesClient animes={finalAnimes} />;
}

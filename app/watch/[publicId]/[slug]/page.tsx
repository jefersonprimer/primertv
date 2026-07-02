import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { connection } from "next/server";
import { resolvePlayableUrl } from "@/lib/playable-url";
import { recordAnimeWatchHistory } from "@/lib/history";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import AnimeEpisodeSidebar from "./EpisodeSidebar";
import SeriesEpisodeSidebar from "./SeriesEpisodeSidebar";
import ExpandableDescription from "@/components/ExpandableDescription";
import ShareButton from "@/components/ShareButton";

interface WatchPageProps {
  params: Promise<{ publicId: string; slug: string }>;
  searchParams?: Promise<{ player?: string }>;
}

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  await connection();

  const { publicId } = await params;
  
  let title = "Episódio não encontrado";
  let description = "";
  let imageUrl = null;

  // First try Anime
  const animeEpisode = await prisma.episode.findUnique({
    where: { publicId },
    include: {
      season: {
        include: {
          anime: true,
        },
      },
    },
  });

  if (animeEpisode) {
    title = `Assistir ${animeEpisode.season.anime.title} - Episódio ${animeEpisode.number} Online`;
    description = `Assista agora ao episódio ${animeEpisode.number} de ${animeEpisode.season.anime.title} em HD. Assista animes online grátis no Primerflix.`;
    imageUrl = animeEpisode.season.anime.imageUrl;
  } else {
    // Try Series
    const seriesEpisode = await prisma.seriesEpisode.findUnique({
      where: { publicId },
      include: {
        season: {
          include: {
            series: true,
          },
        },
      },
    });

    if (seriesEpisode) {
      title = `Assistir ${seriesEpisode.season.series.title} - Episódio ${seriesEpisode.number} Online`;
      description = `Assista agora ao episódio ${seriesEpisode.number} de ${seriesEpisode.season.series.title} em HD. Assista séries online grátis no Primerflix.`;
      imageUrl = seriesEpisode.season.series.imageUrl;
    } else {
      // Try Movie
      const movie = await prisma.movie.findUnique({
        where: { publicId },
      });

      if (movie) {
        title = `Assistir ${movie.title} Online em HD - PrimerTv`;
        description = `Assista ao filme ${movie.title} online grátis em HD no PrimerTv.`;
        imageUrl = movie.imageUrl;
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
      type: "video.episode",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function WatchPage({
  params,
  searchParams,
}: WatchPageProps) {
  await connection();

  const { publicId, slug } = await params;
  const { player } = (await searchParams) || {};

  // 1. Try fetching Anime Episode
  const animeEpisode = await prisma.episode.findUnique({
    where: { publicId },
    include: {
      season: {
        include: {
          anime: {
            include: {
              seasons: {
                orderBy: { number: "asc" },
                include: {
                  episodes: {
                    orderBy: { number: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (animeEpisode) {
    // Enforce correct slug for SEO
    const expectedSlug = animeEpisode.slug || `episodio-${animeEpisode.number}`;
    if (slug !== expectedSlug) {
      redirect(`/watch/${publicId}/${expectedSlug}`);
    }

    await recordAnimeWatchHistory(animeEpisode.id);

    const playersList: { id: string; label: string; url: string }[] = [];

    if (animeEpisode.videoUrl) {
      playersList.push({
        id: "principal",
        label: "Player 1",
        url: animeEpisode.videoUrl,
      });
    }

    if (animeEpisode.customPlayers && animeEpisode.customPlayers.length > 0) {
      animeEpisode.customPlayers.forEach((playerUrl, idx) => {
        const trimmedUrl = playerUrl.trim();
        if (trimmedUrl) {
          playersList.push({
            id: `custom-${idx}`,
            label: `Player ${playersList.length + 1}`,
            url: trimmedUrl,
          });
        }
      });
    }

    const selectedPlayerId =
      player || (playersList.length > 0 ? playersList[0].id : "");
    const activePlayerObj =
      playersList.find((p) => p.id === selectedPlayerId) || playersList[0];

    const playableUrl = activePlayerObj
      ? activePlayerObj.id === "principal"
        ? ((await resolvePlayableUrl(activePlayerObj.url)) ?? activePlayerObj.url)
        : activePlayerObj.url
      : null;

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist("ANIME", animeEpisode.season.anime.id);

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
        <main className="mx-auto max-w-7xl sm:px-4 pb-6 md:pb-10">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Main Content: Player and Info */}
            <div className="lg:col-span-3">
              {/* Player Container */}
              <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
                {playableUrl ? (
                  playableUrl.endsWith(".mp4") ||
                  playableUrl.endsWith(".m3u8") ? (
                    <video
                      src={playableUrl}
                      controls
                      className="h-full w-full"
                      poster={
                        animeEpisode.imageUrl ||
                        animeEpisode.season.anime.imageUrl ||
                        undefined
                      }
                    />
                  ) : (
                    <iframe
                      src={playableUrl}
                      className="absolute inset-0 h-full w-full overflow-y-auto"
                      allowFullScreen
                      scrolling="auto"
                      allow="autoplay; fullscreen; picture-in-picture"
                      title={`Player para ${animeEpisode.season.anime.title} Episódio ${animeEpisode.number}`}
                    />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
                    <p>Vídeo não disponível para este episódio.</p>
                  </div>
                )}
              </div>

              {/* Controls & Title Below Player */}
              <div className="mt-6 flex flex-col gap-6 px-4 sm:px-0">
                {/* Player Selector Tabs */}
                {playersList.length > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        Selecione o Player
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        {activePlayerObj?.label || "Servidor Principal (HD)"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {playersList.map((p) => (
                        <Link
                          key={p.id}
                          href={`?player=${p.id}`}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayerObj?.id === p.id
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center justify-between w-full border-b border-[#bbb] sm:border-0 pb-2 sm:p-0">
                      <Link
                        href={`/animes/${animeEpisode.season.anime.slug}`}
                        className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                      >
                        <h4 className="text-base font-bold">
                          {animeEpisode.season.anime.title}
                        </h4>
                      </Link>

                      <WatchlistButton
                        mediaType="ANIME"
                        mediaId={animeEpisode.season.anime.id}
                        slug={animeEpisode.season.anime.slug}
                        initialInWatchlist={inWatchlist}
                        isLoggedIn={Boolean(userId)}
                        hasBorder={false}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <h1 className="text-[22px] font-bold text-zinc-500">
                        Temporada {animeEpisode.season.number} • Episódio{" "}
                        {animeEpisode.number}
                      </h1>
                      <ShareButton compact />
                    </div>
                  </div>
                  <div className="mt-6">
                    <ExpandableDescription
                      description={
                        animeEpisode.season.anime.description ||
                        "Sem descrição disponível."
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Episode List */}
            <div className="lg:col-span-1 px-4 sm:px-0">
              <div className="sticky overflow-hidden pt-8">
                <AnimeEpisodeSidebar
                  seasons={animeEpisode.season.anime.seasons}
                  currentEpisodeId={animeEpisode.id}
                  animeSlug={animeEpisode.season.anime.slug}
                  animeRating={animeEpisode.season.anime.rating}
                  animeDuration={animeEpisode.season.anime.duration}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Try fetching Series Episode
  const seriesEpisode = await prisma.seriesEpisode.findUnique({
    where: { publicId },
    include: {
      season: {
        include: {
          series: {
            include: {
              seasons: {
                orderBy: { number: "asc" },
                include: {
                  episodes: {
                    orderBy: { number: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (seriesEpisode) {
    // Enforce correct slug for SEO
    const expectedSlug = seriesEpisode.slug || `episodio-${seriesEpisode.number}`;
    if (slug !== expectedSlug) {
      redirect(`/watch/${publicId}/${expectedSlug}`);
    }

    const seasons = seriesEpisode.season.series.seasons;
    const allEpisodes = seasons.flatMap((s) =>
      s.episodes.map((ep) => ({
        ...ep,
        seasonNumber: s.number,
        seasonId: s.id,
      })),
    );

    const tmdbId = seriesEpisode.season.series.tmdbId;
    const seriesFallbackUrl =
      allEpisodes.find((ep) => ep.videoUrl)?.videoUrl || null;
    const scrapedUrl = seriesEpisode.videoUrl || seriesFallbackUrl;
    const hasScrapedUrl = !!scrapedUrl;

    let defaultPlayer = 1;
    if (hasScrapedUrl) {
      defaultPlayer = 1;
    } else if (tmdbId) {
      defaultPlayer = 2;
    }

    let activePlayer = defaultPlayer;
    let currentVideoUrl = scrapedUrl;

    const selectedPlayerStr = player;
    if (selectedPlayerStr === "2" && tmdbId) {
      activePlayer = 2;
      currentVideoUrl = `https://superflixapi.lifestyle/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "3" && tmdbId) {
      activePlayer = 3;
      currentVideoUrl = `https://myembed.biz/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "4" && tmdbId) {
      activePlayer = 4;
      currentVideoUrl = `https://mgeb.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "5" && tmdbId) {
      activePlayer = 5;
      currentVideoUrl = `https://embedplayapi.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
    } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
      activePlayer = 1;
      currentVideoUrl = scrapedUrl;
    } else {
      activePlayer = defaultPlayer;
      if (activePlayer === 2 && tmdbId) {
        currentVideoUrl = `https://superflixapi.lifestyle/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 3 && tmdbId) {
        currentVideoUrl = `https://myembed.biz/serie/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 4 && tmdbId) {
        currentVideoUrl = `https://mgeb.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else if (activePlayer === 5 && tmdbId) {
        currentVideoUrl = `https://embedplayapi.top/embed/${tmdbId}/${seriesEpisode.season.number}/${seriesEpisode.number}`;
      } else {
        currentVideoUrl = scrapedUrl;
      }
    }

    const playableUrl =
      activePlayer === 1 && currentVideoUrl
        ? ((await resolvePlayableUrl(currentVideoUrl)) ?? currentVideoUrl)
        : currentVideoUrl;

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist("SERIES", seriesEpisode.season.series.id);

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
        <main className="mx-auto max-w-7xl sm:px-4 pb-6 md:pb-10">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Main Content: Player and Info */}
            <div className="lg:col-span-3">
              {/* Player Container */}
              <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
                {playableUrl ? (
                  playableUrl.endsWith(".mp4") ||
                  playableUrl.endsWith(".m3u8") ? (
                    <video
                      src={playableUrl}
                      controls
                      className="h-full w-full"
                      poster={seriesEpisode.season.series.imageUrl || undefined}
                    />
                  ) : (
                    <iframe
                      src={playableUrl}
                      className="absolute inset-0 h-full w-full overflow-y-auto"
                      allowFullScreen
                      scrolling="auto"
                      allow="autoplay; fullscreen; picture-in-picture"
                      title={`Player para ${seriesEpisode.season.series.title} Episódio ${seriesEpisode.number}`}
                    />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m10 10 4 4m0-4-4 4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <p>Vídeo não disponível para este episódio.</p>
                  </div>
                )}
              </div>

              {/* Controls & Title Below Player */}
              <div className="mt-6 flex flex-col gap-6 px-4 sm:px-0">
                {/* Player Selector Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Selecione o Player
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {activePlayer === 1
                        ? "Player 1"
                        : activePlayer === 2
                          ? "Player 2"
                          : activePlayer === 3
                            ? "Player 3"
                            : activePlayer === 4
                              ? "Player 4"
                              : activePlayer === 5
                                ? "Player 5"
                                : "Player Desconhecido"}
                    </div>
                  </div>

                  {(hasScrapedUrl || tmdbId) && (
                    <div className="flex flex-wrap gap-2">
                      {hasScrapedUrl && (
                        <Link
                          key="player-1"
                          href="?player=1"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 1
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 1
                        </Link>
                      )}
                      {tmdbId && (
                        <Link
                          key="player-2"
                          href="?player=2"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 2
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 2
                        </Link>
                      )}
                      {tmdbId && (
                        <Link
                          key="player-3"
                          href="?player=3"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 3
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 3
                        </Link>
                      )}
                      {tmdbId && (
                        <Link
                          key="player-4"
                          href="?player=4"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 4
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 4
                        </Link>
                      )}
                      {tmdbId && (
                        <Link
                          key="player-5"
                          href="?player=5"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 5
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 5
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center justify-between w-full border-b border-[#bbb] sm:border-0 pb-2 sm:p-0">
                      <Link
                        href={`/series/${seriesEpisode.season.series.slug}`}
                        className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                      >
                        <h4 className="text-base font-bold">
                          {seriesEpisode.season.series.title}
                        </h4>
                      </Link>

                      <WatchlistButton
                        mediaType="SERIES"
                        mediaId={seriesEpisode.season.series.id}
                        slug={seriesEpisode.season.series.slug}
                        initialInWatchlist={inWatchlist}
                        isLoggedIn={Boolean(userId)}
                        hasBorder={false}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <h1 className="text-[22px] font-bold text-zinc-500">
                        Temporada {seriesEpisode.season.number} • Episódio{" "}
                        {seriesEpisode.number}
                      </h1>
                      <ShareButton compact />
                    </div>
                  </div>
                  <div className="mt-6">
                    <ExpandableDescription
                      description={
                        seriesEpisode.season.series.description ||
                        "Sem descrição disponível."
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Episode List */}
            <div className="lg:col-span-1 px-4 sm:px-0">
              <div className="sticky overflow-hidden pt-8">
                <SeriesEpisodeSidebar
                  seasons={seriesEpisode.season.series.seasons}
                  currentEpisodeId={seriesEpisode.id}
                  seriesSlug={seriesEpisode.season.series.slug}
                  seriesRating={seriesEpisode.season.series.rating}
                  seriesImageUrl={seriesEpisode.season.series.imageUrl}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Try fetching Movie
  const movie = await prisma.movie.findUnique({
    where: { publicId },
  });

  if (movie) {
    // Enforce correct slug for SEO
    const expectedSlug = movie.slug;
    if (slug !== expectedSlug) {
      redirect(`/watch/${publicId}/${expectedSlug}`);
    }

    const isMgebUrl = movie.videoUrl?.includes("mgeb.top");
    const isSuperflixUrl = movie.videoUrl?.includes("superflixapi.lifestyle");
    const isMyembedUrl = movie.videoUrl?.includes("myembed.biz");
    const is2embedUrl = movie.videoUrl?.includes("2embed.cc");
    const isEmbedplayUrl = movie.videoUrl?.includes("embedplayapi.top");
    const hasScrapedUrl =
      movie.videoUrl &&
      !isMgebUrl &&
      !isSuperflixUrl &&
      !isMyembedUrl &&
      !is2embedUrl &&
      !isEmbedplayUrl;

    let currentVideoUrl = movie.videoUrl;
    let activePlayer = 1;

    // Decide default player if none is explicitly selected
    let defaultPlayer = 1;
    if (hasScrapedUrl) {
      defaultPlayer = 1;
    } else if (movie.tmdbId) {
      defaultPlayer = 2; // Default to MGEB if no scraped URL exists
    }

    // Set active player and current URL
    const selectedPlayerStr = player;
    if (selectedPlayerStr === "2" && movie.tmdbId) {
      activePlayer = 2;
      currentVideoUrl = `https://mgeb.top/embed/${movie.tmdbId}`;
    } else if (selectedPlayerStr === "3" && movie.tmdbId) {
      activePlayer = 3;
      currentVideoUrl = `https://superflixapi.lifestyle/filme/${movie.tmdbId}`;
    } else if (selectedPlayerStr === "4" && movie.tmdbId) {
      activePlayer = 4;
      currentVideoUrl = `https://myembed.biz/filme/${movie.tmdbId}`;
    } else if (selectedPlayerStr === "5" && movie.tmdbId) {
      activePlayer = 5;
      currentVideoUrl = `https://www.2embed.cc/embed/${movie.tmdbId}`;
    } else if (selectedPlayerStr === "6" && movie.tmdbId) {
      activePlayer = 6;
      currentVideoUrl = `https://embedplayapi.top/embed/${movie.tmdbId}`;
    } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
      activePlayer = 1;
      currentVideoUrl = movie.videoUrl;
    } else {
      // If no option or invalid option selected, use the default player
      activePlayer = defaultPlayer;
      if (activePlayer === 2 && movie.tmdbId) {
        currentVideoUrl = `https://mgeb.top/embed/${movie.tmdbId}`;
      } else if (activePlayer === 3 && movie.tmdbId) {
        currentVideoUrl = `https://superflixapi.lifestyle/filme/${movie.tmdbId}`;
      } else if (activePlayer === 4 && movie.tmdbId) {
        currentVideoUrl = `https://myembed.biz/filme/${movie.tmdbId}`;
      } else if (activePlayer === 5 && movie.tmdbId) {
        currentVideoUrl = `https://www.2embed.cc/embed/${movie.tmdbId}`;
      } else if (activePlayer === 6 && movie.tmdbId) {
        currentVideoUrl = `https://embedplayapi.top/embed/${movie.tmdbId}`;
      } else {
        currentVideoUrl = movie.videoUrl;
      }
    }

    const playableUrl =
      activePlayer === 1 && currentVideoUrl
        ? ((await resolvePlayableUrl(currentVideoUrl)) ?? currentVideoUrl)
        : currentVideoUrl;

    const isDirectVideo =
      playableUrl?.endsWith(".mp4") || playableUrl?.endsWith(".m3u8");

    const userId = await getAuthenticatedUserId();
    const inWatchlist = await isInWatchlist("SERIES", movie.id);

    const similarMovies =
      movie.genres && movie.genres.length > 0
        ? await prisma.movie.findMany({
            where: {
              genres: { hasSome: movie.genres },
              id: { not: movie.id },
            },
            select: { id: true, slug: true, title: true, imageUrl: true, publicId: true },
            take: 6,
          })
        : [];

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
        <main className="mx-auto max-w-7xl sm:px-4 pb-6 md:pb-10">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* Main Content: Player and Info */}
            <div className="lg:col-span-3">
              {/* Player Container */}
              <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl">
                {playableUrl ? (
                  isDirectVideo ? (
                    <video
                      src={playableUrl}
                      controls
                      className="h-full w-full"
                      poster={movie.imageUrl || undefined}
                    />
                  ) : (
                    <iframe
                      src={playableUrl}
                      className="absolute inset-0 h-full w-full overflow-y-auto border-0"
                      allowFullScreen
                      scrolling="auto"
                      allow="autoplay; fullscreen; picture-in-picture"
                      title={`Player para ${movie.title}`}
                    />
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-zinc-500">
                    <p>O vídeo deste filme ainda está sendo processado.</p>
                  </div>
                )}
              </div>

              {/* Controls & Title Below Player */}
              <div className="mt-6 flex flex-col gap-6 px-4 sm:px-0">
                {/* Player Selector Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      Selecione o Player
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-zinc-500">
                      <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {activePlayer === 1
                        ? "Player 1"
                        : activePlayer === 2
                          ? "Player 2"
                          : activePlayer === 3
                            ? "Player 3"
                            : activePlayer === 4
                              ? "Player 4"
                              : activePlayer === 5
                                ? "Player 5"
                                : activePlayer === 6
                                  ? "Player 6"
                                  : "Player Desconhecido"}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hasScrapedUrl && (
                      <Link
                        key="player-1"
                        href="?player=1"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activePlayer === 1
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        Player 1
                      </Link>
                    )}
                    {movie.tmdbId && (
                      <>
                        <Link
                          key="player-2"
                          href="?player=2"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 2
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 2
                        </Link>
                        <Link
                          key="player-3"
                          href="?player=3"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 3
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 3
                        </Link>
                        <Link
                          key="player-4"
                          href="?player=4"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 4
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 4
                        </Link>
                        <Link
                          key="player-5"
                          href="?player=5"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 5
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 5
                        </Link>
                        <Link
                          key="player-6"
                          href="?player=6"
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            activePlayer === 6
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                              : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          Player 6
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center justify-between w-full border-b border-[#bbb] sm:border-0 pb-2 sm:p-0">
                      <Link
                        href={`/filmes/${movie.slug}`}
                        className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                      >
                        <h4 className="text-base font-bold">
                          {movie.title}
                        </h4>
                      </Link>

                      <WatchlistButton
                        mediaType="SERIES"
                        mediaId={movie.id}
                        slug={movie.slug}
                        initialInWatchlist={inWatchlist}
                        isLoggedIn={Boolean(userId)}
                        hasBorder={false}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <h1 className="text-[22px] font-bold text-zinc-500">
                        Filme
                      </h1>
                      <ShareButton compact />
                    </div>
                  </div>
                  <div className="mt-6">
                    <ExpandableDescription
                      description={
                        movie.description ||
                        "Sem descrição disponível."
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: similar movies */}
            <div className="lg:col-span-1 px-4 sm:px-0">
              <div className="sticky overflow-hidden pt-8">
                {similarMovies.length > 0 && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Recomendados</h3>
                    <div className="flex flex-col gap-4">
                      {similarMovies.map((sim) => (
                        <Link
                          key={sim.id}
                          href={sim.publicId ? `/watch/${sim.publicId}/${sim.slug}` : `/filmes/${sim.slug}`}
                          className="flex gap-3 group animate-fade-in"
                        >
                          <div className="relative w-16 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-zinc-900">
                            {sim.imageUrl && (
                              <img
                                src={sim.imageUrl}
                                alt={sim.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                              />
                            )}
                          </div>
                          <div className="flex flex-col justify-center min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-blue-400 transition-colors">
                              {sim.title}
                            </h4>
                            <span className="text-xs text-zinc-500 mt-1">Filme</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 3. Neither found
  notFound();
}

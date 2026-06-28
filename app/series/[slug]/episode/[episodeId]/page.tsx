import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { connection } from "next/server";
import { resolvePlayableUrl } from "@/lib/playable-url";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";
import EpisodeSidebar from "./EpisodeSidebar";
import ExpandableDescription from "@/components/ExpandableDescription";

interface WatchPageProps {
  params: Promise<{ slug: string; episodeId: string }>;
  searchParams?: Promise<{ player?: string }>;
}

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  await connection();

  const { episodeId } = await params;
  const episode = await prisma.seriesEpisode.findFirst({
    where: { id: episodeId },
    include: {
      season: {
        include: {
          series: true,
        },
      },
    },
  });

  if (!episode) return { title: "Episódio não encontrado" };

  const title = `Assistir ${episode.season.series.title} - Episódio ${episode.number} Online`;
  const description = `Assista agora ao episódio ${episode.number} de ${episode.season.series.title} em HD. Assista séries online grátis no Primerflix.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: episode.season.series.imageUrl
        ? [episode.season.series.imageUrl]
        : [],
      type: "video.episode",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: episode.season.series.imageUrl
        ? [episode.season.series.imageUrl]
        : [],
    },
  };
}

export default async function WatchPage({
  params,
  searchParams,
}: WatchPageProps) {
  await connection();

  const { slug, episodeId } = await params;
  const { player } = (await searchParams) || {};

  // Search for the episode
  const episode = await prisma.seriesEpisode.findFirst({
    where: { id: episodeId },
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

  if (!episode) {
    notFound();
  }

  // Verify if the series slug matches
  if (episode.season.series.slug !== slug) {
    console.warn(
      `Mismatch between URL series slug (${slug}) and episode series slug (${episode.season.series.slug})`,
    );
  }

  const seasons = episode.season.series.seasons;
  const allEpisodes = seasons.flatMap((s) =>
    s.episodes.map((ep) => ({
      ...ep,
      seasonNumber: s.number,
      seasonId: s.id,
    })),
  );
  const currentIndex = allEpisodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < allEpisodes.length - 1
      ? allEpisodes[currentIndex + 1]
      : null;

  const tmdbId = episode.season.series.tmdbId;
  const seriesFallbackUrl =
    allEpisodes.find((ep) => ep.videoUrl)?.videoUrl || null;
  const scrapedUrl = episode.videoUrl || seriesFallbackUrl;
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
    currentVideoUrl = `https://superflixapi.lifestyle/serie/${tmdbId}/${episode.season.number}/${episode.number}`;
  } else if (selectedPlayerStr === "3" && tmdbId) {
    activePlayer = 3;
    currentVideoUrl = `https://myembed.biz/serie/${tmdbId}/${episode.season.number}/${episode.number}`;
  } else if (selectedPlayerStr === "4" && tmdbId) {
    activePlayer = 4;
    currentVideoUrl = `https://mgeb.top/embed/${tmdbId}/${episode.season.number}/${episode.number}`;
  } else if (selectedPlayerStr === "5" && tmdbId) {
    activePlayer = 5;
    currentVideoUrl = `https://embedplayapi.top/embed/${tmdbId}/${episode.season.number}/${episode.number}`;
  } else if (selectedPlayerStr === "1" && hasScrapedUrl) {
    activePlayer = 1;
    currentVideoUrl = scrapedUrl;
  } else {
    activePlayer = defaultPlayer;
    if (activePlayer === 2 && tmdbId) {
      currentVideoUrl = `https://superflixapi.lifestyle/serie/${tmdbId}/${episode.season.number}/${episode.number}`;
    } else if (activePlayer === 3 && tmdbId) {
      currentVideoUrl = `https://myembed.biz/serie/${tmdbId}/${episode.season.number}/${episode.number}`;
    } else if (activePlayer === 4 && tmdbId) {
      currentVideoUrl = `https://mgeb.top/embed/${tmdbId}/${episode.season.number}/${episode.number}`;
    } else if (activePlayer === 5 && tmdbId) {
      currentVideoUrl = `https://embedplayapi.top/embed/${tmdbId}/${episode.season.number}/${episode.number}`;
    } else {
      currentVideoUrl = scrapedUrl;
    }
  }

  const playableUrl =
    activePlayer === 1
      ? ((await resolvePlayableUrl(currentVideoUrl)) ?? currentVideoUrl)
      : currentVideoUrl;

  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("SERIES", episode.season.series.id);

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
                    poster={episode.season.series.imageUrl || undefined}
                  />
                ) : (
                  <iframe
                    src={playableUrl}
                    className="absolute inset-0 h-full w-full overflow-y-auto"
                    allowFullScreen
                    scrolling="auto"
                    allow="autoplay; fullscreen; picture-in-picture"
                    title={`Player para ${episode.season.series.title} Episódio ${episode.number}`}
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
                      ? "Servidor Principal (HD)"
                      : activePlayer === 2
                        ? "Servidor SuperFlix (HD)"
                        : activePlayer === 3
                          ? "Servidor MyEmbed (HD)"
                          : activePlayer === 4
                            ? "Servidor MGEB (HD)"
                            : activePlayer === 5
                              ? "Servidor EmbedPlay (HD)"
                              : "Servidor Desconhecido"}
                  </div>
                </div>

                {(hasScrapedUrl || tmdbId) && (
                  <div className="flex flex-wrap gap-2">
                    {hasScrapedUrl && (
                      <Link
                        href="?player=1"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activePlayer === 1
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        Principal
                      </Link>
                    )}
                    {tmdbId && (
                      <Link
                        href="?player=2"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activePlayer === 2
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        SuperFlix Player
                      </Link>
                    )}
                    {tmdbId && (
                      <Link
                        href="?player=3"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activePlayer === 3
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        MyEmbed Player
                      </Link>
                    )}
                    {tmdbId && (
                      <Link
                        href="?player=4"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activePlayer === 4
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        MGEB Player
                      </Link>
                    )}
                    {tmdbId && (
                      <Link
                        href="?player=5"
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          activePlayer === 5
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black shadow-lg"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        EmbedPlay Player
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {prevEpisode && (
                    <Link
                      href={`/series/${slug}/episode/${prevEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center bg-zinc-200 px-6 text-sm font-bold transition-all hover:bg-zinc-300 active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      Anterior
                    </Link>
                  )}
                  {nextEpisode && (
                    <Link
                      href={`/series/${slug}/episode/${nextEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
                    >
                      Próximo
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full border-b border-[#bbb] sm:border-0 pb-2 sm:p-0">
                    <Link
                      href={`/series/${slug}`}
                      className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                    >
                      <h4 className="text-base font-bold">
                        {episode.season.series.title}
                      </h4>
                    </Link>

                    <WatchlistButton
                      mediaType="SERIES"
                      mediaId={episode.season.series.id}
                      slug={episode.season.series.slug}
                      initialInWatchlist={inWatchlist}
                      isLoggedIn={Boolean(userId)}
                      hasBorder={false}
                    />
                  </div>

                  <h1 className="text-[22px] font-bold text-zinc-500">
                    Temporada {episode.season.number} • Episódio{" "}
                    {episode.number}
                  </h1>
                </div>
                <div className="mt-6">
                  <ExpandableDescription
                    description={
                      episode.season.series.description ||
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
              <EpisodeSidebar
                seasons={episode.season.series.seasons}
                currentEpisodeId={episode.id}
                seriesSlug={slug}
                seriesRating={episode.season.series.rating}
                seriesImageUrl={episode.season.series.imageUrl}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

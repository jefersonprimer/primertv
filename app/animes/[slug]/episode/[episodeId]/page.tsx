import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { connection } from "next/server";
import { resolvePlayableUrl } from "@/lib/playable-url";
import { recordAnimeWatchHistory } from "@/lib/history";
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
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId },
    include: {
      season: {
        include: {
          anime: true,
        },
      },
    },
  });

  if (!episode) return { title: "Episódio não encontrado" };

  const title = `Assistir ${episode.season.anime.title} - Episódio ${episode.number} Online`;
  const description = `Assista agora ao episódio ${episode.number} de ${episode.season.anime.title} em HD. Assista animes online grátis no Primerflix.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: episode.season.anime.imageUrl
        ? [episode.season.anime.imageUrl]
        : [],
      type: "video.episode",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: episode.season.anime.imageUrl
        ? [episode.season.anime.imageUrl]
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

  // Search for the episode. We'll use findFirst to be safe.
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId },
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

  // If episode not found, or if it doesn't belong to the anime in the URL,
  // we could just redirect to the correct URL if we wanted to be super helpful,
  // but for now let's just make sure we find the episode.
  if (!episode) {
    notFound();
  }

  await recordAnimeWatchHistory(episode.id);

  // We should still verify if the anime slug matches, but let's be flexible
  if (episode.season.anime.slug !== slug) {
    console.warn(
      `Mismatch between URL anime slug (${slug}) and episode anime slug (${episode.season.anime.slug})`,
    );
  }

  const seasons = episode.season.anime.seasons;
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

  const playersList: { id: string; label: string; url: string }[] = [];

  if (episode.videoUrl) {
    playersList.push({
      id: "principal",
      label: "Player 1",
      url: episode.videoUrl,
    });
  }

  if (episode.customPlayers && episode.customPlayers.length > 0) {
    episode.customPlayers.forEach((playerUrl, idx) => {
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
  const inWatchlist = await isInWatchlist("ANIME", episode.season.anime.id);

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
                      episode.imageUrl ||
                      episode.season.anime.imageUrl ||
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
                    title={`Player para ${episode.season.anime.title} Episódio ${episode.number}`}
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
                      href={`/animes/${slug}`}
                      className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                    >
                      <h4 className="text-base font-bold">
                        {episode.season.anime.title}
                      </h4>
                    </Link>

                    <WatchlistButton
                      mediaType="ANIME"
                      mediaId={episode.season.anime.id}
                      slug={episode.season.anime.slug}
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
                      episode.season.anime.description ||
                      "Sem descrição disponível."
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Episode List */}
          <div className="lg:col-span-1 px-4 sm:px-0">
            <div className="sticky  overflow-hidden pt-8">
              <EpisodeSidebar
                seasons={episode.season.anime.seasons}
                currentEpisodeId={episode.id}
                animeSlug={slug}
                animeRating={episode.season.anime.rating}
                animeDuration={episode.season.anime.duration}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

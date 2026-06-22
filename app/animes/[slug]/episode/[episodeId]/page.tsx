import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { connection } from "next/server";
import { resolvePlayableUrl } from "@/lib/playable-url";
import { recordAnimeWatchHistory } from "@/lib/history";
import { WatchlistButton } from "@/components/WatchlistButton";
import { getAuthenticatedUserId, isInWatchlist } from "@/lib/watchlist";

interface WatchPageProps {
  params: Promise<{ slug: string; episodeId: string }>;
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

export default async function WatchPage({ params }: WatchPageProps) {
  await connection();

  const { slug, episodeId } = await params;

  // Search for the episode. We'll use findFirst to be safe.
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId },
    include: {
      season: {
        include: {
          anime: true,
          episodes: {
            orderBy: { number: "asc" },
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

  const episodes = episode.season.episodes;
  const currentIndex = episodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const playableUrl =
    (await resolvePlayableUrl(episode.videoUrl)) ?? episode.videoUrl;

  const userId = await getAuthenticatedUserId();
  const inWatchlist = await isInWatchlist("ANIME", episode.season.anime.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <main className="mx-auto max-w-7xl px-4 pb-6 md:pb-10">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content: Player and Info */}
          <div className="lg:col-span-3">
            {/* Player Container */}
            <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
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
            <div className="mt-6 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {prevEpisode && (
                    <Link
                      href={`/animes/${slug}/episode/${prevEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center bg-zinc-200 px-6 text-sm font-bold transition-all hover:bg-zinc-300 active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      Anterior
                    </Link>
                  )}
                  {nextEpisode && (
                    <Link
                      href={`/animes/${slug}/episode/${nextEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
                    >
                      Próximo
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Servidor Principal (HD)
                </div>
              </div>

              <div>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full">
                    <Link
                      href={`/animes/${slug}`}
                      className="inline-block hover:text-blue-500 dark:hover:text-blue-400 transition-colors hover:underline"
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
                <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {episode.season.anime.description ||
                      "Sem descrição disponível."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Episode List */}
          <div className="lg:col-span-1">
            <div className="sticky border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="border-b border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <h3 className="font-bold">Lista de Episódios</h3>
                <p className="text-xs text-zinc-500">
                  Temporada {episode.season.number}
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                <div className="grid gap-1">
                  {episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      href={`/animes/${slug}/episode/${ep.id}`}
                      className={`flex items-center gap-3 rounded-lg p-3 text-sm transition-colors ${
                        ep.id === episode.id
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                          ep.id === episode.id
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                        }`}
                      >
                        {ep.number}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate font-medium">
                          {ep.title || `Episódio ${ep.number}`}
                        </p>
                      </div>
                      {ep.id === episode.id && (
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

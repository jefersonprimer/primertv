import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { connection } from "next/server";
import { resolvePlayableUrl } from "@/lib/playable-url";
import EpisodeSidebar from "./EpisodeSidebar";
import ExpandableDescription from "@/components/ExpandableDescription";

interface WatchPageProps {
  params: Promise<{ slug: string; episodeId: string }>;
}

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  await connection();

  const { episodeId } = await params;
  const episode = await prisma.novelaEpisode.findFirst({
    where: { id: episodeId },
    include: {
      season: {
        include: {
          novela: true,
        },
      },
    },
  });

  if (!episode) return { title: "Capítulo não encontrado" };

  const title = `Assistir ${episode.season.novela.title} - Capítulo ${episode.number} Online`;
  const description = `Assista agora ao capítulo ${episode.number} de ${episode.season.novela.title} em HD. Assista novelas online grátis no Primerflix.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: episode.season.novela.imageUrl
        ? [episode.season.novela.imageUrl]
        : [],
      type: "video.episode",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: episode.season.novela.imageUrl
        ? [episode.season.novela.imageUrl]
        : [],
    },
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  await connection();

  const { slug, episodeId } = await params;

  const episode = await prisma.novelaEpisode.findFirst({
    where: { id: episodeId },
    include: {
      season: {
        include: {
          novela: {
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

  const seasons = episode.season.novela.seasons;
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
      label: "Principal (Scraper)",
      url: episode.videoUrl,
    });
  }

  const playableUrl = episode.videoUrl
    ? ((await resolvePlayableUrl(episode.videoUrl)) ?? episode.videoUrl)
    : null;

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
                    poster={episode.season.novela.imageUrl || undefined}
                  />
                ) : (
                  <iframe
                    src={playableUrl}
                    className="absolute inset-0 h-full w-full overflow-y-auto"
                    allowFullScreen
                    scrolling="auto"
                    allow="autoplay; fullscreen; picture-in-picture"
                    title={`Player para ${episode.season.novela.title} Capítulo ${episode.number}`}
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
                  <p>Vídeo não disponível para este capítulo.</p>
                </div>
              )}
            </div>

            {/* Controls & Title Below Player */}
            <div className="mt-6 flex flex-col gap-6 px-4 sm:px-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {prevEpisode && (
                    <Link
                      href={`/novelas/${slug}/episode/${prevEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center bg-zinc-200 px-6 text-sm font-bold transition-all hover:bg-zinc-300 active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      Anterior
                    </Link>
                  )}
                  {nextEpisode && (
                    <Link
                      href={`/novelas/${slug}/episode/${nextEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
                    >
                      Próximo
                    </Link>
                  )}
                </div>

                {playersList.length <= 1 && (
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Servidor Principal (HD)
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center justify-between w-full border-b border-[#bbb] sm:border-0 pb-2 sm:p-0">
                    <Link
                      href={`/novelas/${slug}`}
                      className="inline-block text-blue-400 hover:text-[#f2f2f2] transition-colors hover:underline"
                    >
                      <h4 className="text-base font-bold">
                        {episode.season.novela.title}
                      </h4>
                    </Link>
                  </div>

                  <h1 className="text-[22px] font-bold text-zinc-500">
                    Temporada {episode.season.number} • Capítulo{" "}
                    {episode.number}
                  </h1>
                </div>
                <div className="mt-6">
                  <ExpandableDescription
                    description={
                      episode.season.novela.description ||
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
                seasons={episode.season.novela.seasons}
                currentEpisodeId={episode.id}
                novelaSlug={slug}
                novelaImageUrl={episode.season.novela.imageUrl}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

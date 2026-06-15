import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { connection } from "next/server";

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
          novela: true,
          episodes: {
            orderBy: { number: "asc" },
          },
        },
      },
    },
  });

  if (!episode) {
    notFound();
  }

  const episodes = episode.season.episodes;
  const currentIndex = episodes.findIndex((e) => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  const isDirectVideo =
    episode.videoUrl?.endsWith(".mp4") || episode.videoUrl?.endsWith(".m3u8");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href={`/novelas/${slug}`}
            className="flex items-center gap-2 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span className="hidden sm:inline">
              Voltar para {episode.season.novela.title}
            </span>
            <span className="sm:hidden">Voltar</span>
          </Link>
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Temporada {episode.season.number}
            </span>
            <h1 className="text-sm font-bold sm:text-base">
              Capítulo {episode.number} {episode.title && `- ${episode.title}`}
            </h1>
          </div>
          <div className="w-20 sm:w-32" />
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
              {episode.videoUrl ? (
                isDirectVideo ? (
                  <video
                    src={episode.videoUrl}
                    controls
                    className="h-full w-full"
                    poster={episode.season.novela.imageUrl || undefined}
                  />
                ) : (
                  <iframe
                    src={episode.videoUrl}
                    className="absolute inset-0 h-full w-full"
                    allowFullScreen
                    scrolling="no"
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

            <div className="mt-6 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {prevEpisode && (
                    <Link
                      href={`/novelas/${slug}/episode/${prevEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-200 px-6 text-sm font-bold transition-all hover:bg-zinc-300 active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      Anterior
                    </Link>
                  )}
                  {nextEpisode && (
                    <Link
                      href={`/novelas/${slug}/episode/${nextEpisode.id}`}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95"
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

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {episode.season.novela.title}
                    </h2>
                    <p className="mt-1 text-zinc-500">
                      Temporada {episode.season.number} • Capítulo{" "}
                      {episode.number}
                    </p>
                  </div>
                </div>
                <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                    Sinopse da Novela
                  </h3>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {episode.season.novela.description ||
                      "Sem descrição disponível."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="border-b border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                <h3 className="font-bold">Lista de Capítulos</h3>
                <p className="text-xs text-zinc-500">
                  Temporada {episode.season.number}
                </p>
              </div>
              <div className="max-h-[600px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                <div className="grid gap-1">
                  {episodes.map((ep) => (
                    <Link
                      key={ep.id}
                      href={`/novelas/${slug}/episode/${ep.id}`}
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
                          {ep.title || `Capítulo ${ep.number}`}
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

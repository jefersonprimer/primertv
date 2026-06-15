import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { connection } from "next/server";

export const revalidate = 3600;

interface MovieDetailsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MovieDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const movie = await prisma.movie.findUnique({ where: { slug } });

  if (!movie) return { title: "Filme não encontrado" };

  return {
    title: `Assistir ${movie.title} Online em HD - Primerflix`,
    description: `Assista ao filme ${movie.title} online grátis em HD no Primerflix.`,
    openGraph: {
      title: movie.title,
      images: movie.imageUrl ? [movie.imageUrl] : [],
    },
  };
}

export default async function MovieDetailsPage({
  params,
}: MovieDetailsPageProps) {
  const { slug } = await params;

  const movie = await prisma.movie.findUnique({
    where: { slug },
  });

  if (!movie) {
    notFound();
  }

  // Simple heuristic to check if it's a video file or an embed
  const isDirectVideo =
    movie.videoUrl?.endsWith(".mp4") || movie.videoUrl?.endsWith(".m3u8");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header/Banner Section */}
      <div className="relative h-[70vh] w-full overflow-hidden bg-zinc-900">
        {movie.imageUrl && (
          <Image
            src={movie.imageUrl}
            alt={movie.title}
            fill
            sizes="100vw"
            className="object-cover opacity-30 blur-sm"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="mx-auto flex max-w-[1223px] flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[2/3] w-48 lg:w-60 flex-shrink-0 overflow-hidden shadow-2xl">
              {movie.imageUrl ? (
                <Image
                  src={movie.imageUrl}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 192px, 240px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-zinc-800 text-zinc-400">
                  Sem imagem
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-blue-500 hover:underline"
              >
                ← Voltar para a Home
              </Link>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl">
                {movie.title}
              </h1>
              {movie.description && (
                <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
                  {movie.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <main id="player" className="mx-auto max-w-[1223px]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Player
          </h2>
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Servidor Principal (HD)
          </div>
        </div>

        <div className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
          {movie.videoUrl ? (
            isDirectVideo ? (
              <video
                src={movie.videoUrl}
                controls
                className="h-full w-full"
                poster={movie.imageUrl || undefined}
              />
            ) : (
              <iframe
                src={movie.videoUrl}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                scrolling="no"
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

        <div className="mt-12 rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Sobre o Filme
          </h3>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {movie.description ||
              "Este filme é uma das adições mais recentes ao nosso catálogo. No momento, estamos coletando mais informações sobre sua sinopse e detalhes técnicos. Aproveite a transmissão em alta definição!"}
          </p>
        </div>
      </main>
    </div>
  );
}

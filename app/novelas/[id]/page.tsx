import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";

interface NovelaDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function NovelaDetailsPage({ params }: NovelaDetailsPageProps) {
  await connection();

  const { id } = await params;

  const novela = await prisma.novela.findUnique({
    where: { id },
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
  });

  if (!novela) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header/Banner Section */}
      <div className="relative h-[40vh] w-full overflow-hidden bg-zinc-900">
        {novela.imageUrl && (
          <Image
            src={novela.imageUrl}
            alt={novela.title}
            fill
            className="object-cover opacity-30 blur-sm"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[2/3] w-48 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl">
              {novela.imageUrl ? (
                <Image
                  src={novela.imageUrl}
                  alt={novela.title}
                  fill
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
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 md:text-5xl">
                {novela.title}
              </h1>
              {novela.description && (
                <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
                  {novela.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <main className="mx-auto max-w-6xl p-8 md:p-12">
        <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Capítulos / Episódios</h2>
        
        {novela.seasons.length === 0 ? (
          <p className="text-zinc-500">Nenhum capítulo encontrado.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {novela.seasons.map((season) => (
              <section key={season.id}>
                {novela.seasons.length > 1 && (
                  <h3 className="mb-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
                    Temporada {season.number}
                  </h3>
                )}
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {season.episodes.map((episode) => (
                    <div
                      key={episode.id}
                      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-500">
                          Episódio {episode.number}
                        </span>
                        {episode.videoUrl && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            HD
                          </span>
                        )}
                      </div>
                      <h4 className="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-100">
                        {episode.title || `Episódio ${episode.number}`}
                      </h4>
                      {episode.videoUrl && (
                        <Link
                          href={`/novelas/${novela.id}/episode/${episode.id}`}
                          className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          Assistir Agora
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

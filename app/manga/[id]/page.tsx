import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";

import EpisodeList from "@/components/EpisodeList";

interface MangaDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MangaDetailsPage({
  params,
}: MangaDetailsPageProps) {
  await connection();

  const { id } = await params;

  const manga = await prisma.manga.findUnique({
    where: { id },
    include: {
      chapters: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!manga) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header/Banner Section */}
      <div className="relative h-[70vh] w-full overflow-hidden bg-zinc-900">
        {manga.imageUrl && (
          <Image
            src={manga.imageUrl}
            alt={manga.title}
            fill
            className="object-cover opacity-30 blur-sm"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black" />

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="mx-auto flex max-w-[1223px] flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[2/3] w-48 lg:60 flex-shrink-0 overflow-hidden shadow-2xl">
              {manga.imageUrl ? (
                <Image
                  src={manga.imageUrl}
                  alt={manga.title}
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
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl">
                {manga.title}
              </h1>
              {manga.description && (
                <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
                  {manga.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Section */}
      <main className="mx-auto max-w-[1223px]">
        <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Capítulos
        </h2>

        {manga.chapters.length === 0 ? (
          <p className="text-zinc-500">Nenhum capítulo encontrado.</p>
        ) : (
          <EpisodeList
            items={manga.chapters}
            baseUrl={`/manga/${manga.id}/chapter`}
            label="Capítulo"
            itemType="chapter"
          />
        )}
      </main>
    </div>
  );
}

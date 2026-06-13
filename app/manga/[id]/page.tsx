import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";

interface MangaDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MangaDetailsPage({ params }: MangaDetailsPageProps) {
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
      <div className="relative h-[40vh] w-full overflow-hidden bg-zinc-900">
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
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-end">
            <div className="relative aspect-[2/3] w-48 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl">
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
              <Link
                href="/"
                className="text-sm font-medium text-blue-500 hover:underline"
              >
                ← Voltar para a Home
              </Link>
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 md:text-5xl">
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
      <main className="mx-auto max-w-6xl p-8 md:p-12">
        <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Capítulos</h2>
        
        {manga.chapters.length === 0 ? (
          <p className="text-zinc-500">Nenhum capítulo encontrado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {manga.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-500">
                    Capítulo {chapter.number}
                  </span>
                </div>
                <h4 className="line-clamp-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {chapter.title || `Capítulo ${chapter.number}`}
                </h4>
                <Link
                  href={`/manga/${manga.id}/chapter/${chapter.id}`}
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Ler Agora
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

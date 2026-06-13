import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";

interface ChapterPageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  await connection();

  const { id, chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      manga: true,
    },
  });

  if (!chapter || chapter.mangaId !== id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/90 p-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex flex-col">
            <Link
              href={`/manga/${chapter.mangaId}`}
              className="text-xs font-medium text-blue-500 hover:underline"
            >
              ← Voltar para {chapter.manga.title}
            </Link>
            <h1 className="text-lg font-bold">
              Capítulo {chapter.number} {chapter.title && `- ${chapter.title}`}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-4">
        {chapter.pages.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-zinc-400">Este capítulo ainda não tem páginas processadas.</p>
            <Link
              href={`/manga/${chapter.mangaId}`}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700"
            >
              Voltar
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {chapter.pages.map((url, index) => (
              <div key={index} className="relative w-full overflow-hidden">
                <img
                  src={url}
                  alt={`Página ${index + 1}`}
                  className="h-auto w-full object-contain"
                  loading={index < 3 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 p-12 text-center text-zinc-500">
        Você chegou ao fim do capítulo.
      </footer>
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import MangaReader from "@/components/MangaReader";

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

  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        mangaId: id,
        number: { lt: chapter.number },
      },
      orderBy: { number: "desc" },
    }),
    prisma.chapter.findFirst({
      where: {
        mangaId: id,
        number: { gt: chapter.number },
      },
      orderBy: { number: "asc" },
    }),
  ]);

  const prevChapterUrl = prevChapter ? `/mangas/${id}/chapter/${prevChapter.id}` : null;
  const nextChapterUrl = nextChapter ? `/mangas/${id}/chapter/${nextChapter.id}` : null;

  return (
    <MangaReader
      pages={chapter.pages}
      chapterNumber={chapter.number}
      chapterTitle={chapter.title}
      mangaTitle={chapter.manga.title}
      mangaId={id}
      prevChapterUrl={prevChapterUrl}
      nextChapterUrl={nextChapterUrl}
    />
  );
}

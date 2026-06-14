import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import MangaReader from "@/components/MangaReader";

interface ChapterPageProps {
  params: Promise<{ slug: string; chapterId: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  await connection();

  const { slug, chapterId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      manga: true,
    },
  });

  if (!chapter || chapter.manga.slug !== slug) {
    notFound();
  }

  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        manga: { slug },
        number: { lt: chapter.number },
      },
      orderBy: { number: "desc" },
    }),
    prisma.chapter.findFirst({
      where: {
        manga: { slug },
        number: { gt: chapter.number },
      },
      orderBy: { number: "asc" },
    }),
  ]);

  const prevChapterUrl = prevChapter ? `/mangas/${slug}/chapter/${prevChapter.id}` : null;
  const nextChapterUrl = nextChapter ? `/mangas/${slug}/chapter/${nextChapter.id}` : null;

  return (
    <MangaReader
      pages={chapter.pages}
      chapterNumber={chapter.number}
      chapterTitle={chapter.title}
      mangaTitle={chapter.manga.title}
      mangaId={slug}
      prevChapterUrl={prevChapterUrl}
      nextChapterUrl={nextChapterUrl}
    />
  );
}


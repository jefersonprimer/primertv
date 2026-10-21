import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { connection } from "next/server";
import { Metadata } from "next";
import {
  buildAlternates,
  buildOpenGraph,
  buildTwitter,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import MangaReader from "@/components/MangaReader";

interface ChapterPageProps {
  params: Promise<{ locale: string; publicId: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  await connection();

  const { locale, publicId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { publicId },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    return { title: "Capítulo não encontrado" };
  }

  const title = `Ler ${chapter.manga.title} - Capítulo ${chapter.number} Online - PrimerTv`;
  const description = `Leia online o capítulo ${chapter.number} de ${chapter.manga.title} grátis no PrimerTv.`;

  return {
    title,
    description,
    alternates: buildAlternates(
      locale,
      `/read/${chapter.publicId}/${chapter.slug}`,
    ),
    openGraph: buildOpenGraph({
      title,
      description,
      locale,
      type: "book",
      images: chapter.manga.imageUrl ? [chapter.manga.imageUrl] : [],
      url: `${SITE_URL}/${locale}/read/${chapter.publicId}/${chapter.slug}`,
    }),
    twitter: buildTwitter({
      card: "summary_large_image",
      title,
      description,
      images: chapter.manga.imageUrl ? [chapter.manga.imageUrl] : [],
    }),
  };
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  await connection();

  const { publicId, slug } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { publicId },
    include: {
      manga: true,
    },
  });

  if (!chapter) {
    notFound();
  }

  // Enforce correct slug for SEO
  const expectedSlug = chapter.slug || `chapter-${chapter.number}`;
  if (slug !== expectedSlug) {
    redirect(`/read/${publicId}/${expectedSlug}`);
  }

  const [prevChapter, nextChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        mangaId: chapter.mangaId,
        number: { lt: chapter.number },
      },
      orderBy: { number: "desc" },
      select: { publicId: true, slug: true, number: true },
    }),
    prisma.chapter.findFirst({
      where: {
        mangaId: chapter.mangaId,
        number: { gt: chapter.number },
      },
      orderBy: { number: "asc" },
      select: { publicId: true, slug: true, number: true },
    }),
  ]);

  const prevChapterUrl = prevChapter?.publicId
    ? `/read/${prevChapter.publicId}/${prevChapter.slug || `chapter-${prevChapter.number}`}`
    : null;
  const nextChapterUrl = nextChapter?.publicId
    ? `/read/${nextChapter.publicId}/${nextChapter.slug || `chapter-${nextChapter.number}`}`
    : null;

  return (
    <MangaReader
      pages={chapter.pages}
      chapterNumber={chapter.number}
      chapterTitle={chapter.title}
      mangaTitle={chapter.manga.title}
      mangaId={chapter.manga.slug}
      prevChapterUrl={prevChapterUrl}
      nextChapterUrl={nextChapterUrl}
    />
  );
}

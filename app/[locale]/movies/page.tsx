import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaCarouselSkeleton } from "@/components/MediaCarouselSkeleton";
import { Suspense } from "react";
import { HeroCarousel, HeroCarouselSkeleton } from "@/components/HeroCarousel";
import { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600; // revalida a cada hora

interface MoviesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MoviesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

async function RecentMoviesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  const items = await prisma.movie.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("recentTitle")}
      subtitle={t("recentSubtitle")}
      items={items}
      type="movie"
    />
  );
}

async function TopRatedMoviesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  const items = await prisma.movie.findMany({
    where: {
      score: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { score: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("topRatedTitle")}
      subtitle={t("topRatedSubtitle")}
      items={items}
      type="movie"
    />
  );
}

async function ActionAdventureMoviesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  const items = await prisma.movie.findMany({
    where: {
      genres: {
        hasSome: ["Ação", "Aventura"],
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("actionAdventureTitle")}
      subtitle={t("actionAdventureSubtitle")}
      items={items}
      type="movie"
    />
  );
}

async function ComedyMoviesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  const items = await prisma.movie.findMany({
    where: {
      genres: {
        has: "Comédia",
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("comedyTitle")}
      subtitle={t("comedySubtitle")}
      items={items}
      type="movie"
    />
  );
}

async function DramaMoviesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  const items = await prisma.movie.findMany({
    where: {
      genres: {
        has: "Drama",
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("dramaTitle")}
      subtitle={t("dramaSubtitle")}
      items={items}
      type="movie"
    />
  );
}

async function SciFiSuspenseMoviesCarousel({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "MoviesPage" });
  const items = await prisma.movie.findMany({
    where: {
      genres: {
        hasSome: ["Ficção científica", "Suspense", "Mistério"],
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title={t("sciFiSuspenseTitle")}
      subtitle={t("sciFiSuspenseSubtitle")}
      items={items}
      type="movie"
    />
  );
}

export default async function MoviesPage({ params }: MoviesPageProps) {
  await connection();
  const { locale } = await params;

  return (
    <>
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <HeroCarousel type="movie" />
      </Suspense>
      <div className="pl-3 md:pl-8 lg:pl-12 xl:pl-0 md:-translate-y-48 lg:-translate-y-22 xl:-translate-y-38">
        <main className="space-y-8 lg:space-y-16">
          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <RecentMoviesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <TopRatedMoviesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <ActionAdventureMoviesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <ComedyMoviesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <DramaMoviesCarousel locale={locale} />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <SciFiSuspenseMoviesCarousel locale={locale} />
          </Suspense>
        </main>
      </div>
    </>
  );
}

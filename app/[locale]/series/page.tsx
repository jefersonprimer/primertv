import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaCarouselSkeleton } from "@/components/MediaCarouselSkeleton";
import { Suspense } from "react";
import { HeroCarousel, HeroCarouselSkeleton } from "@/components/HeroCarousel";
import { Metadata } from "next";
import { connection } from "next/server";
import { TrendingNowCarousel } from "@/components/TrendingNowCarousel";

export const metadata: Metadata = {
  title: "Séries - PrimerTv",
  description: "Assista às suas séries favoritas online em HD no PrimerTv.",
};

export const revalidate = 3600; // revalida a cada hora

async function TrendingSeriesCarousel() {
  const items = await prisma.series.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: [
      { score: "desc" },
      { createdAt: "desc" },
    ],
    take: 10,
  });

  return (
    <TrendingNowCarousel
      title="Top 10 Séries em Alta"
      subtitle="As séries mais populares e comentadas do momento"
      items={items}
    />
  );
}

async function RecentSeriesCarousel() {
  const items = await prisma.series.findMany({
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
      title="Recém Adicionadas"
      subtitle="As séries mais recentes na plataforma"
      items={items}
      type="series"
    />
  );
}

async function TopRatedSeriesCarousel() {
  const items = await prisma.series.findMany({
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
      title="Melhores Avaliadas"
      subtitle="Sucessos de crítica e público"
      items={items}
      type="series"
    />
  );
}

async function DramaSeriesCarousel() {
  const items = await prisma.series.findMany({
    where: {
      genres: { has: "Drama" },
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
      title="Séries de Drama"
      subtitle="Histórias profundas e emocionantes"
      items={items}
      type="series"
    />
  );
}

async function ActionSeriesCarousel() {
  const items = await prisma.series.findMany({
    where: {
      genres: {
        hasSome: ["Action", "Adventure"],
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
      title="Ação & Aventura"
      subtitle="Adrenalina pura e grandes jornadas"
      items={items}
      type="series"
    />
  );
}

async function SciFiSeriesCarousel() {
  const items = await prisma.series.findMany({
    where: {
      genres: {
        hasSome: ["Science-Fiction", "Thriller"],
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
      title="Ficção Científica & Suspense"
      subtitle="Mistério, tecnologia e realidades alternativas"
      items={items}
      type="series"
    />
  );
}

export default async function SeriesPage() {
  await connection();

  return (
    <>
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <HeroCarousel type="series" />
      </Suspense>
      <div className="pl-3 md:pl-8 lg:pl-12 xl:pl-0 -translate-y-18 sm:translate-y-0 md:-translate-y-18 lg:-translate-y-32 xl:-translate-y-40">
        <main className="space-y-8 lg:space-y-16">
          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <TrendingSeriesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <RecentSeriesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <TopRatedSeriesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <DramaSeriesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <ActionSeriesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <SciFiSeriesCarousel />
          </Suspense>
        </main>
      </div>
    </>
  );
}

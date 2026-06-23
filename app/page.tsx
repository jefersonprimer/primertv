import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaCarouselSkeleton } from "@/components/MediaCarouselSkeleton";
import { Suspense } from "react";
import {
  FavoritesCarousel,
  FavoritesCarouselSkeleton,
} from "@/components/FavoritesCarousel";
import {
  HistoryCarousel,
  HistoryCarouselSkeleton,
} from "@/components/HistoryCarousel";
import { TodayReleases } from "@/components/TodayReleases";
import { TodayReleasesSkeleton } from "@/components/TodayReleasesSkeleton";
import { HeroCarousel, HeroCarouselSkeleton } from "@/components/HeroCarousel";

export const revalidate = 3600; // revalida a cada hora

async function AnimeCarousel() {
  const items = await prisma.anime.findMany({
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
      title="Animes"
      subtitle="Suas animações favoritas"
      items={items}
      type="anime"
      viewAllHref="/animes"
    />
  );
}

async function SeriesCarousel() {
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
      title="Séries Populares"
      subtitle="Maratone agora"
      items={items}
      type="series"
      viewAllHref="/series"
    />
  );
}

async function MovieCarousel() {
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
      title="Filmes Recentes"
      subtitle="Lançamentos do cinema"
      items={items}
      type="movie"
      viewAllHref="/filmes"
    />
  );
}

async function MangaCarousel() {
  const items = await prisma.manga.findMany({
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
      title="Mangás Recentes"
      subtitle="Leia os capítulos mais novos"
      items={items}
      type="manga"
      viewAllHref="/mangas"
    />
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <HeroCarousel />
      </Suspense>
      <div className="py-8 pl-3 md:pl-8 lg:pl-12 xl:pl-0 md:-translate-y-30 xl:-translate-y-50">
        <main className="space-y-16">
          <Suspense fallback={<FavoritesCarouselSkeleton />}>
            <FavoritesCarousel />
          </Suspense>

          <Suspense fallback={<HistoryCarouselSkeleton />}>
            <HistoryCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <SeriesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <MovieCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <AnimeCarousel />
          </Suspense>

          <Suspense fallback={<TodayReleasesSkeleton />}>
            <TodayReleases />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <MangaCarousel />
          </Suspense>
        </main>
      </div>
    </>
  );
}

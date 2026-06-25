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
import { getCurrentSeasonSlug, parseSeasonAndYear } from "@/lib/seasons";

export const revalidate = 3600; // revalida a cada hora

const seasonTranslations: Record<string, string> = {
  winter: "Inverno",
  spring: "Primavera",
  summer: "Verão",
  fall: "Outono",
};

async function TopAnimesCarousel() {
  const items = await prisma.anime.findMany({
    where: {
      rank: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
    },
    orderBy: { rank: "asc" },
    take: 15,
  });

  return (
    <MediaCarousel title="Animes Mais Populares" items={items} type="anime" />
  );
}

async function CurrentSeasonCarousel() {
  const currentSlug = getCurrentSeasonSlug();
  const [currentSeason, currentYearStr] = currentSlug.split("-");
  const currentYear = parseInt(currentYearStr, 10);

  const allAnimes = await prisma.anime.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      premiered: true,
      aired: true,
    },
  });

  const filteredItems = allAnimes.filter((anime) => {
    const info = parseSeasonAndYear(anime.premiered, anime.aired);
    if (!info) return false;
    return info.season === currentSeason && info.year === currentYear;
  });

  const seasonLabel = seasonTranslations[currentSeason] || currentSeason;

  return (
    <MediaCarousel
      title="Animes desta Temporada"
      subtitle={`Lançamentos de ${seasonLabel} de ${currentYear}`}
      items={filteredItems}
      type="anime"
    />
  );
}

async function NextSeasonCarousel() {
  const currentSlug = getCurrentSeasonSlug();
  const [currentSeason, currentYearStr] = currentSlug.split("-");
  const currentYear = parseInt(currentYearStr, 10);

  const seasonsOrder = ["winter", "spring", "summer", "fall"];
  const currentIdx = seasonsOrder.indexOf(currentSeason);

  let nextSeason = "winter";
  let nextYear = currentYear + 1;
  if (currentIdx < 3) {
    nextSeason = seasonsOrder[currentIdx + 1];
    nextYear = currentYear;
  }
  const nextSlug = `${nextSeason}-${nextYear}`;

  const allAnimes = await prisma.anime.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      imageUrl: true,
      premiered: true,
      aired: true,
    },
  });

  const filteredItems = allAnimes.filter((anime) => {
    const info = parseSeasonAndYear(anime.premiered, anime.aired);
    if (!info) return false;
    return info.season === nextSeason && info.year === nextYear;
  });

  const seasonLabel = seasonTranslations[nextSeason] || nextSeason;

  return (
    <MediaCarousel
      title="Animes da Próxima Temporada"
      subtitle={`Lançamentos de ${seasonLabel} de ${nextYear}`}
      items={filteredItems}
      type="anime"
    />
  );
}

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
      title="Animes Recentes"
      subtitle="Suas animações favoritas"
      items={items}
      type="anime"
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
    />
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <HeroCarousel />
      </Suspense>
      <div className="pl-3 md:pl-8 lg:pl-12 xl:pl-0 -translate-y-26 sm:-translate-y-2 md:-translate-y-18 lg:-translate-y-32 xl:-translate-y-40">
        <main className="space-y-8 lg:space-y-16">
          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <TopAnimesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <NextSeasonCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <CurrentSeasonCarousel />
          </Suspense>

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

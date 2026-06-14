import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaCarouselSkeleton } from "@/components/MediaCarouselSkeleton";
import { Suspense } from "react";

async function AnimeCarousel() {
  const items = await prisma.anime.findMany({
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

async function NovelaCarousel() {
  const items = await prisma.novela.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return (
    <MediaCarousel
      title="Novelas"
      subtitle="As melhores tramas"
      items={items}
      type="novela"
      viewAllHref="/novelas"
    />
  );
}

async function ChannelCarousel() {
  const items = await prisma.channel.findMany({
    orderBy: { title: "asc" },
  });
  return (
    <MediaCarousel
      title="Canais TV"
      subtitle="Assista ao vivo"
      items={items}
      type="channel"
      viewAllHref="/channels"
    />
  );
}

export default function Home() {
  return (
    <div className="py-8 px-2">
      <main className="space-y-16">
        <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
          <ChannelCarousel />
        </Suspense>

        <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
          <NovelaCarousel />
        </Suspense>

        <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
          <MovieCarousel />
        </Suspense>

        <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
          <AnimeCarousel />
        </Suspense>

        <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
          <SeriesCarousel />
        </Suspense>

        <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
          <MangaCarousel />
        </Suspense>
      </main>
    </div>
  );
}

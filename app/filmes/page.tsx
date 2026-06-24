import { prisma } from "@/lib/prisma";
import { MediaCarousel } from "@/components/MediaCarousel";
import { MediaCarouselSkeleton } from "@/components/MediaCarouselSkeleton";
import { Suspense } from "react";
import { HeroCarousel, HeroCarouselSkeleton } from "@/components/HeroCarousel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Filmes - PrimerTv",
  description: "Assista aos seus filmes favoritos online em HD no PrimerTv.",
};

export const revalidate = 3600; // revalida a cada hora

async function RecentMoviesCarousel() {
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
      title="Recém Adicionados"
      subtitle="Os filmes mais recentes na plataforma"
      items={items}
      type="movie"
    />
  );
}

async function TopRatedMoviesCarousel() {
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
      title="Melhores Avaliados"
      subtitle="Sucessos de crítica e público"
      items={items}
      type="movie"
    />
  );
}

async function ActionAdventureMoviesCarousel() {
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
      title="Ação & Aventura"
      subtitle="Adrenalina pura e grandes jornadas"
      items={items}
      type="movie"
    />
  );
}

async function ComedyMoviesCarousel() {
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
      title="Comédia"
      subtitle="Para se divertir e dar boas risadas"
      items={items}
      type="movie"
    />
  );
}

async function DramaMoviesCarousel() {
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
      title="Drama"
      subtitle="Histórias intensas e emocionantes"
      items={items}
      type="movie"
    />
  );
}

async function SciFiSuspenseMoviesCarousel() {
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
      title="Ficção Científica & Suspense"
      subtitle="Tecnologia, mistérios e realidades alternativas"
      items={items}
      type="movie"
    />
  );
}

export default function MoviesPage() {
  return (
    <>
      <Suspense fallback={<HeroCarouselSkeleton />}>
        <HeroCarousel type="movie" />
      </Suspense>
      <div className="py-8 pl-3 md:pl-8 lg:pl-12 xl:pl-0 md:-translate-y-30 xl:-translate-y-50">
        <main className="space-y-16">
          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <RecentMoviesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <TopRatedMoviesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <ActionAdventureMoviesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <ComedyMoviesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <DramaMoviesCarousel />
          </Suspense>

          <Suspense fallback={<MediaCarouselSkeleton hasSubtitle />}>
            <SciFiSuspenseMoviesCarousel />
          </Suspense>
        </main>
      </div>
    </>
  );
}

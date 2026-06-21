import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { Metadata } from "next";
import {
  Sparkles,
  Tv,
  Film,
  Clapperboard,
  BookOpen,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Recém Adicionados - PrimerTv",
  description:
    "Confira as últimas novidades, episódios e lançamentos recém adicionados na plataforma.",
};

export const dynamic = "force-dynamic";

const TABS = [
  { id: "animes", label: "Animes", icon: Tv },
  { id: "series", label: "Séries", icon: Tv },
  { id: "novelas", label: "Novelas", icon: Clapperboard },
  { id: "filmes", label: "Filmes", icon: Film },
  { id: "mangas", label: "Mangás", icon: BookOpen },
] as const;

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();

  if (diffMs < 0) return "Agora mesmo";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) {
    return "Agora mesmo";
  }
  if (diffMins < 60) {
    return `Há ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  }
  if (diffHours < 24) {
    return `Há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  }
  if (diffDays < 7) {
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }
  if (diffWeeks < 4) {
    return `Há ${diffWeeks} ${diffWeeks === 1 ? "semana" : "semanas"}`;
  }
  return `Há ${diffMonths} ${diffMonths === 1 ? "mês" : "meses"}`;
}

export default async function NewReleasesPage({ searchParams }: PageProps) {
  await connection();
  const { type } = await searchParams;

  const activeTab = [
    "animes",
    "series",
    "novelas",
    "filmes",
    "mangas",
  ].includes(type || "")
    ? (type as "animes" | "series" | "novelas" | "filmes" | "mangas")
    : "animes";

  let items: any[] = [];

  try {
    if (activeTab === "animes") {
      const recentAnimes = await prisma.anime.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          seasons: {
            include: {
              episodes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        take: 100,
      });

      const processed = recentAnimes.map((anime) => {
        let latestDate = anime.updatedAt;
        for (const season of anime.seasons) {
          if (season.episodes.length > 0) {
            const epDate = new Date(season.episodes[0].createdAt);
            if (epDate > latestDate) {
              latestDate = epDate;
            }
          }
        }
        return {
          id: anime.id,
          slug: anime.slug,
          title: anime.title,
          imageUrl: anime.imageUrl,
          addedAt: latestDate,
          href: `/animes/${anime.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed.slice(0, 60);
    } else if (activeTab === "series") {
      const recentSeries = await prisma.series.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          seasons: {
            include: {
              episodes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        take: 100,
      });

      const processed = recentSeries.map((series) => {
        let latestDate = series.updatedAt;
        for (const season of series.seasons) {
          if (season.episodes.length > 0) {
            const epDate = new Date(season.episodes[0].createdAt);
            if (epDate > latestDate) {
              latestDate = epDate;
            }
          }
        }
        return {
          id: series.id,
          slug: series.slug,
          title: series.title,
          imageUrl: series.imageUrl,
          addedAt: latestDate,
          href: `/series/${series.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed.slice(0, 60);
    } else if (activeTab === "novelas") {
      const recentNovelas = await prisma.novela.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          seasons: {
            include: {
              episodes: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
        take: 100,
      });

      const processed = recentNovelas.map((novela) => {
        let latestDate = novela.updatedAt;
        for (const season of novela.seasons) {
          if (season.episodes.length > 0) {
            const epDate = new Date(season.episodes[0].createdAt);
            if (epDate > latestDate) {
              latestDate = epDate;
            }
          }
        }
        return {
          id: novela.id,
          slug: novela.slug,
          title: novela.title,
          imageUrl: novela.imageUrl,
          addedAt: latestDate,
          href: `/novelas/${novela.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed.slice(0, 60);
    } else if (activeTab === "filmes") {
      const movies = await prisma.movie.findMany({
        orderBy: { createdAt: "desc" },
        take: 60,
      });

      items = movies.map((movie) => ({
        id: movie.id,
        slug: movie.slug,
        title: movie.title,
        imageUrl: movie.imageUrl,
        addedAt: movie.createdAt,
        href: `/filmes/${movie.slug}`,
      }));
    } else if (activeTab === "mangas") {
      const recentMangas = await prisma.manga.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          chapters: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        take: 100,
      });

      const processed = recentMangas.map((manga) => {
        let latestDate = manga.updatedAt;
        if (manga.chapters.length > 0) {
          const chDate = new Date(manga.chapters[0].createdAt);
          if (chDate > latestDate) {
            latestDate = chDate;
          }
        }
        return {
          id: manga.id,
          slug: manga.slug,
          title: manga.title,
          imageUrl: manga.imageUrl,
          addedAt: latestDate,
          href: `/mangas/${manga.slug}`,
        };
      });

      processed.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
      items = processed.slice(0, 60);
    }
  } catch (error) {
    console.error("Error loading new releases:", error);
  }

  // Format timeAgo for all items
  const finalItems = items.map((item) => ({
    ...item,
    timeAgo: formatTimeAgo(item.addedAt),
  }));

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 md:py-12">
      {/* Navigation Tabs */}
      <div className="mb-10 flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/new?type=${tab.id}`}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Releases Grid */}
      <main className="min-h-[400px]">
        {finalItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-900">
              <Tv className="h-12 w-12 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Nenhum lançamento adicionado
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Não encontramos nenhum item cadastrado recentemente para essa
              categoria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {finalItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col gap-3"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-md ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl group-hover:shadow-blue-500/15">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500 text-sm">
                      Sem imagem
                    </div>
                  )}

                  {/* Hover play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transform scale-90 transition-transform duration-300 group-hover:scale-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-blue-500">
                    {item.title}
                  </h3>
                  <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.timeAgo}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

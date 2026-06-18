"use server";

import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/MediaCard";
import { connection } from "next/server";
import { SearchBar } from "@/components/SearchBar";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();

  const { q: query } = await searchParams;

  if (!query) {
    return (
      <div className="w-full">
        <SearchBar />
      </div>
    );
  }

  const [animes, series, movies, mangas, novelas] = await Promise.all([
    prisma.anime.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      take: 24,
    }),
    prisma.series.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      take: 24,
    }),
    prisma.movie.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      take: 24,
    }),
    prisma.manga.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      take: 24,
    }),
    prisma.novela.findMany({
      where: {
        title: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
      },
      take: 24,
    }),
  ]);

  const hasResults =
    animes.length > 0 ||
    series.length > 0 ||
    movies.length > 0 ||
    mangas.length > 0 ||
    novelas.length > 0;

  return (
    <div className="w-full">
      <SearchBar />

      <div className="mx-auto max-w-[1130px] px-8 py-12">
        <main className="space-y-16">
          {!hasResults && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-zinc-500">
                Nenhum resultado encontrado para "{query}".
              </p>
              <p className="text-zinc-400">
                Tente buscar por termos diferentes ou verifique a ortografia.
              </p>
            </div>
          )}

          {animes.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Animes
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {animes.map((anime) => (
                  <MediaCard
                    key={anime.id}
                    item={anime}
                    type="anime"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 200px"
                  />
                ))}
              </div>
            </section>
          )}

          {series.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Séries
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {series.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    type="series"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 200px"
                  />
                ))}
              </div>
            </section>
          )}

          {movies.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Filmes
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {movies.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    type="movie"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 200px"
                  />
                ))}
              </div>
            </section>
          )}

          {mangas.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Mangás
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {mangas.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    type="manga"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 200px"
                  />
                ))}
              </div>
            </section>
          )}

          {novelas.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Novelas
              </h2>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {novelas.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    type="novela"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 200px"
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

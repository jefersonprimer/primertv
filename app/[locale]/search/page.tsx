import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/MediaCard";
import { SearchTopResultCard } from "@/components/SearchTopResultCard";
import { SearchBar } from "@/components/SearchBar";
import { getTranslations } from "next-intl/server";
import { buildAlternates, NOINDEX_ROBOTS } from "@/lib/seo";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = (await searchParams) || {};
  const t = await getTranslations({ locale, namespace: "Search" });

  const title = q
    ? `${q} - ${t("placeholder")}`
    : `${t("placeholder")} - PrimerTv`;

  return {
    title,
    robots: NOINDEX_ROBOTS,
    alternates: buildAlternates(locale, "/search"),
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("Search");
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
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            titleEnglish: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            seasons: {
              some: {
                title: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        bannerUrl: true,
        compactImageUrl: true,
        isDubbed: true,
        isSubtitled: true,
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
      <SearchBar defaultValue={query} />

      <div className="mx-auto max-w-[1130px] px-4 sm:px-8 py-6 sm:py-12">
        <main className="space-y-10 sm:space-y-16">
          {!hasResults && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-zinc-300 font-medium">
                {t("noResults", { query })}
              </p>
              <p className="text-zinc-500 mt-2">
                {t("checkSpelling")}
              </p>
            </div>
          )}

          {animes.length > 0 && (
            <section>
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                {t("topResults")}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {animes.slice(0, 3).map((anime) => (
                  <SearchTopResultCard
                    key={anime.id}
                    item={anime}
                    type="anime"
                  />
                ))}
              </div>
            </section>
          )}

          {animes.length > 0 && (
            <section>
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                {t("animes")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                {t("series")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                {t("movies")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                {t("mangas")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
              <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-white">
                {t("novelas")}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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

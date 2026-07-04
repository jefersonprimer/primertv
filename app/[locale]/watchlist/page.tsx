"use server";

import { MediaCard } from "@/components/MediaCard";
import FavoriteCard from "@/components/FavoriteCard";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { getAnimeBanner } from "@/lib/banners";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { getFirstAnimeEpisodes } from "@/lib/media-performance";

type WatchlistRow = {
  id: string;
  mediaType: "ANIME" | "MANGA" | "SERIES";
  animeId: string | null;
  mangaId: string | null;
  seriesId: string | null;
  createdAt: Date;
};

type WatchlistAnime = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  rating: string | null;
  duration: string | null;
};

type WatchlistSeries = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
};

type WatchlistManga = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
};

export default async function WatchlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();

  const { locale } = await params;
  const t = await getTranslations("Watchlist");
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect({ href: "/login", locale });
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      mediaType: true,
      animeId: true,
      mangaId: true,
      seriesId: true,
      createdAt: true,
    },
  });

  const typedItems = items as WatchlistRow[];

  const animeIds = typedItems
    .filter(
      (item): item is WatchlistRow & { mediaType: "ANIME"; animeId: string } =>
        item.mediaType === "ANIME" && Boolean(item.animeId),
    )
    .map((item) => item.animeId);

  const mangaIds = typedItems
    .filter(
      (item): item is WatchlistRow & { mediaType: "MANGA"; mangaId: string } =>
        item.mediaType === "MANGA" && Boolean(item.mangaId),
    )
    .map((item) => item.mangaId);

  const seriesIds = typedItems
    .filter(
      (
        item,
      ): item is WatchlistRow & { mediaType: "SERIES"; seriesId: string } =>
        item.mediaType === "SERIES" && Boolean(item.seriesId),
    )
    .map((item) => item.seriesId);

  const [animeRecords, mangaRecords, seriesRecords] = await Promise.all([
    animeIds.length > 0
      ? prisma.anime.findMany({
          where: { id: { in: animeIds } },
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
            bannerUrl: true,
            rating: true,
            duration: true,
          },
        })
      : Promise.resolve([] as WatchlistAnime[]),
    mangaIds.length > 0
      ? prisma.manga.findMany({
          where: { id: { in: mangaIds } },
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
          },
        })
      : Promise.resolve([] as WatchlistManga[]),
    seriesIds.length > 0
      ? prisma.series.findMany({
          where: { id: { in: seriesIds } },
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
          },
        })
      : Promise.resolve([] as WatchlistSeries[]),
  ]);

  const animeById = new Map(animeRecords.map((anime) => [anime.id, anime]));
  const mangaById = new Map(mangaRecords.map((manga) => [manga.id, manga]));
  const seriesById = new Map(seriesRecords.map((serie) => [serie.id, serie]));

  const orderedAnimes = animeIds
    .map((animeId) => animeById.get(animeId))
    .filter((anime): anime is WatchlistAnime => Boolean(anime));

  const orderedMangas = mangaIds
    .map((mangaId) => mangaById.get(mangaId))
    .filter((manga): manga is WatchlistManga => Boolean(manga));

  const orderedSeries = seriesIds
    .map((seriesId) => seriesById.get(seriesId))
    .filter((serie): serie is WatchlistSeries => Boolean(serie));

  const firstEpisodeByAnimeId = await getFirstAnimeEpisodes(
    orderedAnimes.map((anime) => anime.id),
  );

  const animes = await Promise.all(
    orderedAnimes.map(async (anime) => {
      let banner = anime.bannerUrl;
      if (!banner) {
        banner = await getAnimeBanner(anime.id, anime.title);
      }
      const finalBannerUrl = banner === "none" ? null : banner;

      const firstEpisode = firstEpisodeByAnimeId.get(anime.id);
      const firstEpisodeId = firstEpisode?.firstEpisodeId || null;
      const firstEpisodeImageUrl = firstEpisode?.firstEpisodeImageUrl || null;

      return {
        id: anime.id,
        slug: anime.slug,
        title: anime.title,
        bannerUrl: finalBannerUrl || anime.imageUrl,
        firstEpisodeId,
        firstEpisodeImageUrl,
        rating: anime.rating,
        duration: anime.duration,
      };
    }),
  );

  const mangas = orderedMangas;
  const seriesList = orderedSeries;

  const isEmpty =
    animes.length === 0 && mangas.length === 0 && seriesList.length === 0;

  return (
    <div className="mx-auto max-w-[1130px] py-6">
      <div className="mx-auto max-w-[1050px]">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
        </header>

        <main className="space-y-16">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-zinc-500">{t("emptyTitle")}</p>
              <p className="mt-2 text-zinc-400">
                {t.rich("emptySubtitle", {
                  animesLink: (chunks) => (
                    <Link
                      href="/animes"
                      className="text-blue-500 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                  seriesLink: (chunks) => (
                    <Link
                      href="/series"
                      className="text-blue-500 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                  mangasLink: (chunks) => (
                    <Link
                      href="/mangas"
                      className="text-blue-500 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          ) : (
            <>
              {animes.length > 0 && (
                <section>
                  <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {t("animes")}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {animes.map((item) => (
                      <FavoriteCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {seriesList.length > 0 && (
                <section>
                  <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {t("series")}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {seriesList.map((item) => (
                      <MediaCard key={item.id} item={item} type="series" />
                    ))}
                  </div>
                </section>
              )}

              {mangas.length > 0 && (
                <section>
                  <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {t("mangas")}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {mangas.map((item) => (
                      <MediaCard key={item.id} item={item} type="manga" />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

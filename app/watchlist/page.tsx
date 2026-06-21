"use server";

import { MediaCard } from "@/components/MediaCard";
import FavoriteCard from "@/components/FavoriteCard";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { getAnimeBanner } from "@/lib/banners";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

export default async function WatchlistPage() {
  await connection();

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      anime: {
        include: {
          seasons: {
            orderBy: { number: "asc" },
            take: 1,
            include: {
              episodes: {
                orderBy: { number: "asc" },
                take: 1,
              },
            },
          },
        },
      },
      manga: {
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
        },
      },
    },
  });

  const rawAnimes = items
    .filter((item) => item.mediaType === "ANIME" && item.anime)
    .map((item) => item.anime!);

  const animes = await Promise.all(
    rawAnimes.map(async (anime) => {
      let banner = anime.bannerUrl;
      if (!banner) {
        banner = await getAnimeBanner(anime.id, anime.title);
      }
      const finalBannerUrl = banner === "none" ? null : banner;

      const firstEpisode = anime.seasons[0]?.episodes[0];
      const firstEpisodeId = firstEpisode?.id || null;
      const firstEpisodeImageUrl = firstEpisode?.imageUrl || null;

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

  const mangas = items
    .filter((item) => item.mediaType === "MANGA" && item.manga)
    .map((item) => item.manga!);

  const isEmpty = animes.length === 0 && mangas.length === 0;

  return (
    <div className="mx-auto max-w-[1130px] p-8">
      <div className="mx-auto max-w-[1050px]">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Minha Watchlist
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Animes e mangás que você salvou para assistir ou ler depois.
          </p>
        </header>

        <main className="space-y-16">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl text-zinc-500">Sua watchlist está vazia.</p>
              <p className="mt-2 text-zinc-400">
                Explore{" "}
                <Link href="/animes" className="text-blue-500 hover:underline">
                  animes
                </Link>{" "}
                ou{" "}
                <Link href="/mangas" className="text-blue-500 hover:underline">
                  mangás
                </Link>{" "}
                e adicione à sua lista.
              </p>
            </div>
          ) : (
            <>
              {animes.length > 0 && (
                <section>
                  <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Animes
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {animes.map((item) => (
                      <FavoriteCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {mangas.length > 0 && (
                <section>
                  <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Mangás
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

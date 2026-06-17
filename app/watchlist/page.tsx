"use server";

import { MediaCard } from "@/components/MediaCard";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
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
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
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

  const animes = items
    .filter((item) => item.mediaType === "ANIME" && item.anime)
    .map((item) => item.anime!);

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
              <p className="text-xl text-zinc-500">
                Sua watchlist está vazia.
              </p>
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
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {animes.map((item) => (
                      <MediaCard key={item.id} item={item} type="anime" />
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

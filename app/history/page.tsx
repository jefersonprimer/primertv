"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory } from "@/lib/history";
import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { HistoryCard } from "@/components/HistoryCard";

export default async function HistoricoPage() {
  await connection();

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const items = await getAnimeWatchHistory(userId);

  const resolvedItems = items.map((item) => {
    const episode = item.episode;
    const season = episode.season;
    const anime = season.anime;

    return {
      id: item.id,
      episodeId: episode.id,
      episodeNumber: episode.number,
      episodeTitle: episode.title,
      episodeImageUrl: episode.imageUrl,
      episodePublicId: episode.publicId,
      episodeSlug: episode.slug,
      seasonNumber: season.number,
      animeId: anime.id,
      animeSlug: anime.slug,
      animeTitle: anime.title,
      animeImageUrl: anime.imageUrl,
      watchedAt: item.watchedAt,
    };
  });

  return (
    <div className="mx-auto max-w-[1130px] p-8">
      <div className="mx-auto max-w-[1050px]">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Histórico
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Os últimos {items.length > 0 ? items.length : 24} episódios de anime
            que você assistiu.
          </p>
        </header>

        <main>
          {resolvedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock
                className="mb-4 text-zinc-300 dark:text-zinc-700"
                size={48}
              />
              <p className="text-xl text-zinc-500">Seu histórico está vazio.</p>
              <p className="mt-2 text-zinc-400">
                Assista episódios em{" "}
                <Link href="/animes" className="text-blue-500 hover:underline">
                  animes
                </Link>{" "}
                para vê-los aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {resolvedItems.map((item) => (
                <HistoryCard key={item.id} item={item} className="w-full" />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

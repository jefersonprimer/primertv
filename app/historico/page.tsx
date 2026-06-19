"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory } from "@/lib/history";
import Link from "next/link";
import Image from "next/image";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

function formatWatchedAt(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HistoricoPage() {
  await connection();

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  const items = await getAnimeWatchHistory(userId);

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
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock className="mb-4 text-zinc-300 dark:text-zinc-700" size={48} />
              <p className="text-xl text-zinc-500">
                Seu histórico está vazio.
              </p>
              <p className="mt-2 text-zinc-400">
                Assista episódios em{" "}
                <Link href="/animes" className="text-blue-500 hover:underline">
                  animes
                </Link>{" "}
                para vê-los aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const anime = item.episode.season.anime;
                const href = `/animes/${anime.slug}/episode/${item.episode.id}`;

                return (
                  <Link
                    key={item.id}
                    href={href}
                    className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/20"
                  >
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {anime.imageUrl ? (
                        <Image
                          src={anime.imageUrl}
                          alt={anime.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                          N/A
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                        {anime.title}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Temporada {item.episode.season.number} • Episódio{" "}
                        {item.episode.number}
                        {item.episode.title && ` — ${item.episode.title}`}
                      </p>
                    </div>

                    <time
                      dateTime={item.watchedAt.toISOString()}
                      className="shrink-0 text-xs text-zinc-400"
                    >
                      {formatWatchedAt(item.watchedAt)}
                    </time>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

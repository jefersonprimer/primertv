"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory } from "@/lib/history";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Clock } from "lucide-react";
import { HistoryCard } from "@/components/HistoryCard";

export default async function HistoricoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();

  const { locale } = await params;
  const t = await getTranslations("History");
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect({ href: "/login", locale });
  }

  const items = await getAnimeWatchHistory(userId!);

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
      isDubbed: anime.isDubbed,
      isSubtitled: anime.isSubtitled,
    };
  });

  return (
    <div className="mx-auto max-w-[1130px] py-6">
      <div className="mx-auto max-w-[1050px]">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("description", { count: items.length > 0 ? items.length : 24 })}
          </p>
        </header>

        <main>
          {resolvedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock
                className="mb-4 text-zinc-300 dark:text-zinc-700"
                size={48}
              />
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
                })}
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

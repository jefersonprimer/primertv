"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory } from "@/lib/history";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Clock } from "lucide-react";
import { HistoryCard } from "@/components/HistoryCard";
import { ProfileTabs } from "@/components/ProfileTabs";

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
    <div className="mx-auto max-w-[1130px] py-6 px-4 md:px-0">
      <ProfileTabs />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 sm:pb-4 mx-2">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-[28px] mx-2 md:mx-0">
          {t("title")}
        </h1>
      </div>

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
          <div>
            {/* Desktop/Tablet History Grid */}
            <div className="hidden sm:grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {resolvedItems.map((item) => (
                <HistoryCard key={item.id} item={item} className="w-full" />
              ))}
            </div>

            {/* Mobile History List */}
            <div className="flex sm:hidden flex-col gap-3 px-2">
              {resolvedItems.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  isMobileRow
                  className="w-full"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

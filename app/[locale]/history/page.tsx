import type { Metadata } from "next";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { getAnimeWatchHistory, HISTORY_PAGE_SIZE } from "@/lib/history";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Clock } from "lucide-react";
import HistoryPageContent from "@/components/HistoryPageContent";
import { ProfileTabs } from "@/components/ProfileTabs";
import { buildAlternates, NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "History" });

  return {
    title: `${t("title")} - primertv`,
    robots: NOINDEX_ROBOTS,
    alternates: buildAlternates(locale, "/history"),
  };
}

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

  const fetchedItems = await getAnimeWatchHistory(userId!, HISTORY_PAGE_SIZE + 1);
  const hasMore = fetchedItems.length > HISTORY_PAGE_SIZE;
  const items = fetchedItems.slice(0, HISTORY_PAGE_SIZE);

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
          <HistoryPageContent initialItems={resolvedItems} initialHasMore={hasMore} />
        )}
      </main>
    </div>
  );
}

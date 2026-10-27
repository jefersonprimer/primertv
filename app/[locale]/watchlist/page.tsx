import type { Metadata } from "next";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ProfileTabs } from "@/components/ProfileTabs";
import WatchlistContent from "@/components/WatchlistContent";
import { getWatchlistPageData } from "@/lib/watchlist-page-data";
import { buildAlternates, NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Watchlist" });
  return { title: `${t("title")} - primertv`, robots: NOINDEX_ROBOTS, alternates: buildAlternates(locale, "/watchlist") };
}

export default async function WatchlistPage({ params }: { params: Promise<{ locale: string }> }) {
  await connection();
  const { locale } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) redirect({ href: "/login", locale });
  const initialPage = await getWatchlistPageData(userId, 0, "newest", "all");
  return <div className="mx-auto max-w-[1130px] py-6 px-4 md:px-0">
    <ProfileTabs />
    <main className="space-y-6">
      <WatchlistContent initialItems={initialPage.items} initialHasMore={initialPage.hasMore} />
    </main>
  </div>;
}

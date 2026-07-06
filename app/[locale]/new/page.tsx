import { Link } from "@/i18n/routing";
import { connection } from "next/server";
import { Metadata } from "next";
import { getNewReleases } from "@/app/actions/newReleases";
import { NewReleasesList } from "@/components/NewReleasesList";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NewReleasesPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function NewReleasesPage({
  params,
  searchParams,
}: PageProps) {
  await connection();
  const { locale } = await params;
  const { type } = await searchParams;
  const t = await getTranslations({ locale, namespace: "NewReleasesPage" });

  const activeTab = [
    "animes",
    "series",
    "novelas",
    "filmes",
    "mangas",
  ].includes(type || "")
    ? (type as "animes" | "series" | "novelas" | "filmes" | "mangas")
    : "animes";

  const { items, hasMore } = await getNewReleases({
    type: activeTab,
    page: 1,
    limit: 24,
  });

  const TABS = [
    { id: "animes", label: t("tabs.animes") },
    { id: "series", label: t("tabs.series") },
    { id: "novelas", label: t("tabs.novelas") },
    { id: "filmes", label: t("tabs.filmes") },
    { id: "mangas", label: t("tabs.mangas") },
  ] as const;

  return (
    <div className="mx-auto max-w-[1130px] px-4 md:px-0 py-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2 sm:pb-4 border-zinc-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/new?type=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Releases Grid */}
      <main className="min-h-[400px] mt-6">
        <NewReleasesList
          key={activeTab}
          initialItems={items}
          initialHasMore={hasMore}
          activeTab={activeTab}
        />
      </main>
    </div>
  );
}

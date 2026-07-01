import Link from "next/link";
import { connection } from "next/server";
import { Metadata } from "next";
import { getNewReleases } from "@/app/actions/newReleases";
import { NewReleasesList } from "@/components/NewReleasesList";

export const metadata: Metadata = {
  title: "Recém Adicionados - PrimerTv",
  description:
    "Confira as últimas novidades, episódios e lançamentos recém adicionados na plataforma.",
};

export const dynamic = "force-dynamic";

const TABS = [
  { id: "animes", label: "Animes" },
  { id: "series", label: "Séries" },
  { id: "novelas", label: "Novelas" },
  { id: "filmes", label: "Filmes" },
  { id: "mangas", label: "Mangás" },
] as const;

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewReleasesPage({ searchParams }: PageProps) {
  await connection();
  const { type } = await searchParams;

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

  return (
    <div className="mx-auto max-w-[1130px] px-4 py-8 md:py-12">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/new?type=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
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

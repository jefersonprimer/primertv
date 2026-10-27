import type { Metadata } from "next";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, FolderOpen } from "lucide-react";
import CustomListItems from "@/components/CustomListItems";
import EditListModal from "@/components/EditListModal";
import { buildAlternates, NOINDEX_ROBOTS } from "@/lib/seo";
import { loadCustomListItems } from "@/app/actions/lists";

interface ListDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: ListDetailsPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Lists" });

  return {
    title: `${t("title")} - primertv`,
    robots: NOINDEX_ROBOTS,
    alternates: buildAlternates(locale, `/lists/${id}`),
  };
}

export default async function ListDetailsPage({
  params,
}: ListDetailsPageProps) {
  await connection();
  const t = await getTranslations("Lists");

  const { locale, id } = await params;
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect({ href: "/login", locale });
  }

  // Fetch the list details
  const list = await prisma.customList.findUnique({
    where: { id },
  });

  if (!list || list.userId !== userId!) {
    notFound();
  }

  const initialPage = await loadCustomListItems(id, 0);
  const isEmpty = initialPage.total === 0;

  return (
    <div className="mx-auto max-w-[1130px] py-6 px-2 md:px-0">
      <div className="mx-auto max-w-[1050px]">
        {/* Back navigation */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#bbb] hover:text-white transition-colors mb-6 uppercase"
        >
          <ChevronLeft className="h-5 w-5" />
          {t("backToLists")}
        </Link>

        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-[28px]">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-sm text-[#f2f2f2] mt-2 max-w-2xl">
                {list.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0">
            <EditListModal
              listId={list.id}
              initialName={list.name}
              initialDescription={list.description}
              triggerType="button"
            />
          </div>
        </header>

        <main>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#bbb]">
              <FolderOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-xl text-zinc-500">{t("emptyListTitle")}</p>
              <p className="mt-2 text-zinc-400">
                {t.rich("emptyListSubtitle", {
                  animesLink: (chunks) => (
                    <Link
                      href="/animes"
                      className="text-blue-500 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                  seriesLink: (chunks) => (
                    <Link
                      href="/series"
                      className="text-blue-500 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          ) : (
            <CustomListItems
              listId={list.id}
              initialItems={initialPage.items}
              initialHasMore={initialPage.hasMore}
              initialTotal={initialPage.total}
            />
          )}
        </main>
      </div>
    </div>
  );
}

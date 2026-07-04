"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, FolderOpen } from "lucide-react";
import { MediaCard } from "@/components/MediaCard";
import RemoveFromListButton from "@/components/RemoveFromListButton";

interface ListDetailsPageProps {
  params: Promise<{ locale: string; id: string }>;
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

  // Fetch all items in the list
  const items = await prisma.customListItem.findMany({
    where: { listId: id },
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
      series: {
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
        },
      },
    },
  });

  const isEmpty = items.length === 0;

  return (
    <div className="mx-auto max-w-[1130px] py-6">
      <div className="mx-auto max-w-[1050px]">
        {/* Back navigation */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-855 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToLists")}
        </Link>

        <header className="mb-12">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            {list.name}
          </h1>
          {list.description && (
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {list.description}
            </p>
          )}
          <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 mt-2">
            {t("itemsAdded", { count: items.length })}
          </div>
        </header>

        <main>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
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
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {items.map((item) => {
                const mediaItem = item.anime || item.series;
                const mediaType = item.anime ? "anime" : "series";
                if (!mediaItem) return null;
                return (
                  <div
                    key={item.id}
                    className="relative group animate-in fade-in zoom-in-95 duration-200"
                  >
                    <RemoveFromListButton
                      listId={list.id}
                      animeId={item.anime?.id}
                      seriesId={item.series?.id}
                    />
                    <MediaCard item={mediaItem} type={mediaType} />
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

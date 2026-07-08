"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { Link, redirect } from "@/i18n/routing";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ChevronRight } from "lucide-react";
import CreateListModal from "@/components/CreateListModal";
import EditListModal from "@/components/EditListModal";
import DeleteListButton from "@/components/DeleteListButton";

export default async function ListasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await connection();

  const { locale } = await params;
  const t = await getTranslations("Lists");
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect({ href: "/login", locale });
  }

  // Fetch all custom lists
  const lists = await prisma.customList.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  const totalLists = lists.length;

  return (
    <div className="mx-auto max-w-[1130px] py-6 px-4 md:px-0">
      <h1 className="text-xl font-bold tracking-tight text-white sm:text-[28px]">
        {t("title")}
      </h1>
      <div className="flex items-center gap-4 my-2 md:my-4 text-sm font-semibold text-[#bbb]">
        {totalLists < 10 && <CreateListModal />}
        <span>{t("limitCreated", { count: totalLists })}</span>
      </div>

      <main>
        {totalLists === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#bbb] text-center min-h-[300px]">
            <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px]">
              {t("emptySubtitle")}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => {
              const count = list._count.items;

              return (
                <div
                  key={list.id}
                  className="flex flex-col justify-between overflow-hidden bg-[#272727] px-6 py-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-white transition-colors truncate">
                          {list.name}
                        </h2>
                        {list.description && (
                          <p className="text-sm text-[#bbb] mt-1 truncate">
                            {list.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <EditListModal
                          listId={list.id}
                          initialName={list.name}
                          initialDescription={list.description}
                          triggerType="icon"
                        />
                        <DeleteListButton
                          listId={list.id}
                          listName={list.name}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-xs text-[#bbb]">
                      {t("cardAnimeCount", { count })}
                    </span>

                    <Link
                      href={`/lists/${list.id}`}
                      className="flex items-center gap-1.5 text-sm font-semibold text-[#bbb] hover:text-white  transition-colors"
                    >
                      {t("viewList")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

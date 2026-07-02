"use server";

import { getAuthenticatedUserId } from "@/lib/watchlist";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import CreateListModal from "@/components/CreateListModal";
import DeleteListButton from "@/components/DeleteListButton";

export default async function ListasPage() {
  await connection();

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    redirect("/login");
  }

  // Fetch all custom lists
  const lists = await prisma.customList.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  const totalLists = lists.length;

  return (
    <div className="mx-auto max-w-[1130px] p-8">
      <div className="mx-auto max-w-[1050px]">
        <header className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Minhas Listas
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Crie e organize suas próprias coleções personalizadas de animes.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {totalLists < 10 && <CreateListModal />}
            <span>{totalLists} / 10 listas criadas</span>
          </div>
        </header>

        <main>
          {totalLists === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-center min-h-[300px]">
              <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
                Nenhuma lista criada
              </p>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px]">
                Crie sua primeira lista clicando no botão &quot;Criar Nova Lista&quot; acima para começar a organizar seus animes!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => {
                const count = list._count.items;

                return (
                  <div
                    key={list.id}
                    className="flex flex-col justify-between overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-colors truncate">
                            {list.name}
                          </h2>
                          {list.description && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                              {list.description}
                            </p>
                          )}
                        </div>
                        <DeleteListButton
                          listId={list.id}
                          listName={list.name}
                        />
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {count} / 100 animes
                      </span>

                      <Link
                        href={`/listas/${list.id}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      >
                        Ver Lista
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
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

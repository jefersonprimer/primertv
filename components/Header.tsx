import Link from "next/link";
import { LayoutDashboard, User, Bookmark, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <span className="text-2xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
              Primer
              <span className="font-light text-blue-600 dark:text-blue-500">
                TV
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/filmes"
              className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
            >
              Filmes
            </Link>
            <Link
              href="/series"
              className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
            >
              Séries
            </Link>

            <Link
              href="/channels"
              className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
            >
              Canais
            </Link>
            <Link
              href="/novelas"
              className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
            >
              Novelas
            </Link>

            <Link
              href="/animes"
              className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
            >
              Animes
            </Link>

            <Link
              href="/mangas"
              className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
            >
              Mangas
            </Link>
          </nav>
        </div>

        <div className="flex h-full items-center">
          <Link
            href="/search"
            className="flex h-full items-center px-4 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Search size={22} />
          </Link>

          {user ? (
            <div className="flex h-full items-center">
              {user.role !== "admin" && (
                <Link
                  href="/watchlist"
                  className="flex h-full items-center px-4 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <Bookmark size={22} />
                </Link>
              )}
              <UserMenu user={user} />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-full items-center px-4 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800">
                <User size={20} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

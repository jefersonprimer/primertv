import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { LayoutDashboard, User } from "lucide-react";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export async function Header() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-2">
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
        <nav className="ml-8 hidden items-center gap-6 md:flex">
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
        <div className="hidden flex-1 justify-center px-8 lg:flex">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900 sm:flex"
                >
                  <LayoutDashboard size={16} />
                  Admin
                </Link>
              )}
              <span className="hidden text-sm font-medium sm:block">
                {user.name}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                >
                  Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

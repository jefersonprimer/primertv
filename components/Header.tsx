import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-500">
            PrimerTV
          </span>
        </Link>
        <nav className="ml-8 hidden items-center gap-6 md:flex">
          <Link
            href="/movie"
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
            href="/anime"
            className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
          >
            Animes
          </Link>
          <Link
            href="/channels"
            className="text-sm font-medium text-zinc-600 hover:text-blue-500 dark:text-zinc-400 dark:hover:text-blue-500"
          >
            Canais
          </Link>
        </nav>
        <div className="hidden flex-1 justify-center px-8 md:flex">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
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
        </div>
      </div>
    </header>
  );
}

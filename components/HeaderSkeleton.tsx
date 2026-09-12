import { Menu } from "lucide-react";

export function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 bg-[#0E0E0E]">
      <div className="mx-auto flex h-14 2xl:h-16 max-w-full items-center justify-between">
        <div className="flex h-full items-center gap-4">
          <div className="flex h-full items-center gap-3">
            <div className="flex p-2 2xl:p-2.5 items-center justify-center rounded-full text-[#bbb] lg:hidden">
              <Menu className="w-6 h-6" />
            </div>
            <div className="flex items-center text-xl tracking-tight text-zinc-500 select-none">
              <span className="font-semibold text-zinc-400">primer</span>
              <span className="font-black text-zinc-400 ml-1">
                tv
              </span>
            </div>
          </div>

          {/* Desktop Nav placeholders */}
          <nav className="hidden h-full items-center sm:flex gap-1">
            <div className="h-8 w-18 animate-pulse rounded-md bg-zinc-800/60" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-800/60" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-zinc-800/60" />
            <div className="hidden md:block h-8 w-18 animate-pulse rounded-md bg-zinc-800/60" />
            <div className="hidden lg:block h-8 w-20 animate-pulse rounded-md bg-zinc-800/60" />
          </nav>
        </div>

        {/* Right side icons placeholders (Busca, Bookmark, User/Avatar) */}
        <div className="flex h-full items-center gap-1.5">
          {/* Busca */}
          <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-800/60" />
          {/* Bookmark (visível em md+) */}
          <div className="hidden md:block h-10 w-10 animate-pulse rounded-full bg-zinc-800/60" />
          {/* User / Avatar */}
          <div className="h-9 w-9 2xl:h-10 2xl:w-10 animate-pulse rounded-full bg-zinc-800/60" />
        </div>
      </div>
    </header>
  );
}


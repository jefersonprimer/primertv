export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-2">
        <div className="flex items-center gap-1">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-200 md:hidden dark:bg-zinc-800" />
          <span className="text-xl font-bold tracking-tighter text-zinc-400/60 dark:text-white/40">
            Primer
            <span className="font-light">Tv</span>
          </span>

          {/* Desktop Nav placeholders */}
          <nav className="ml-8 hidden gap-6 md:flex">
            <div className="h-4 w-20 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-16 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-20 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          </nav>
        </div>

        {/* Right side icons placeholders */}
        <div className="flex items-center gap-4">
          {/* Mobile search icon placeholder */}
          <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800 md:hidden" />

          {/* Search Icon */}
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          {/* Bookmark Icon */}
          <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          {/* User button placeholder */}
          <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </header>
  );
}

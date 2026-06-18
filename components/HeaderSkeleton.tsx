export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-2">
        {/* Logo placeholder */}
        <div className="flex items-center gap-1">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-200 md:hidden dark:bg-zinc-800" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Desktop Nav placeholders */}
        <nav className="ml-8 hidden items-center gap-6 md:flex">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"
            />
          ))}
        </nav>

        {/* Search Bar placeholder */}
        <div className="hidden flex-1 justify-center px-8 md:flex">
          <div className="h-12 w-full max-w-xl animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>

        {/* Right side icons placeholders */}
        <div className="flex items-center gap-4">
          {/* Mobile search icon placeholder */}
          <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800 md:hidden" />
          
          {/* User button placeholder */}
          <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </header>
  );
}

export function TodayReleasesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 animate-pulse">
      {/* Title skeleton */}
      <div className="mb-6 border-b border-zinc-100 pb-4 dark:border-zinc-900">
        <div className="h-7 w-52  bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-4 w-80  bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Two-column cards skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex gap-4 p-3 -2xl bg-zinc-50/50 border border-zinc-100 dark:bg-zinc-900/30 dark:border-zinc-900"
          >
            {/* Banner skeleton */}
            <div className="aspect-[16/10] w-28 sm:w-36 flex-shrink-0 bg-zinc-200 dark:bg-zinc-800" />

            {/* Info skeleton */}
            <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
              <div>
                <div className="h-5 w-3/4  bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-3 flex gap-1">
                  <div className="h-4 w-12  bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-6  bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-6  bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-6  bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
              <div className="h-4 w-32  bg-zinc-200 dark:bg-zinc-800 mt-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <div className="mt-8 flex justify-center">
        <div className="h-10 w-[1018px] bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

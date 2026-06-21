interface PosterGridSkeletonProps {
  count?: number;
}

export function PosterGridSkeleton({ count = 24 }: PosterGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex flex-col gap-3 animate-pulse">
          <div className="relative aspect-[2/3] w-full bg-zinc-200 shadow-md ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10" />
          <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

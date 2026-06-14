export function MediaCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[2/3] animate-pulse overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-md" />
      <div className="space-y-2">
        <div className="h-4 w-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

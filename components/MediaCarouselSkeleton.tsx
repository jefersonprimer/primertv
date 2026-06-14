import { MediaCardSkeleton } from "./MediaCardSkeleton";

interface MediaCarouselSkeletonProps {
  hasTitle?: boolean;
  hasSubtitle?: boolean;
}

export function MediaCarouselSkeleton({
  hasTitle = true,
  hasSubtitle = false,
}: MediaCarouselSkeletonProps) {
  return (
    <section className="relative">
      {(hasTitle || hasSubtitle) && (
        <div className="mb-6 px-8">
          {hasTitle && (
            <div className="h-8 w-48 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          )}
          {hasSubtitle && (
            <div className="mt-2 h-4 w-64 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          )}
        </div>
      )}

      <div className="flex gap-6 overflow-hidden px-8 pb-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-[160px] flex-shrink-0 sm:w-[200px]">
            <MediaCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

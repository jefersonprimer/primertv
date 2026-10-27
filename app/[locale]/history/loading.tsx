function HistoryCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2 rounded-md p-2">
      <div className="aspect-video w-full rounded-md bg-zinc-800" />
      <div className="mt-1 h-4 w-3/4 rounded bg-zinc-800" />
      <div className="h-3 w-1/2 rounded bg-zinc-800" />
      <div className="h-3 w-2/3 rounded bg-zinc-800" />
    </div>
  );
}

function MobileHistoryCardSkeleton() {
  return (
    <div className="flex w-full animate-pulse gap-4 p-2">
      <div className="aspect-[2/3] w-[84px] shrink-0 bg-zinc-800" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-800" />
        <div className="h-3 w-1/2 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div className="mx-auto max-w-[1130px] px-4 py-6 md:px-0" aria-busy="true">
      <div className="mb-8 flex gap-6 border-b border-zinc-800/80 px-2 pb-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-5 w-20 animate-pulse rounded bg-zinc-800" />
        ))}
      </div>
      <div className="mx-2 mb-4 h-8 w-40 animate-pulse rounded bg-zinc-800" />
      <div className="hidden grid-cols-2 gap-4 sm:grid md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <HistoryCardSkeleton key={index} />)}
      </div>
      <div className="flex flex-col gap-3 px-2 sm:hidden">
        {Array.from({ length: 6 }, (_, index) => <MobileHistoryCardSkeleton key={index} />)}
      </div>
    </div>
  );
}

import { PosterGridSkeleton } from "@/components/PosterGridSkeleton";

export default function SeasonsLoading() {
  return (
    <div className="mx-auto max-w-[1130px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-8 w-48 animate-pulse bg-zinc-800 sm:h-9" />
        <div className="h-10 w-44 animate-pulse bg-zinc-800" />
      </div>

      <PosterGridSkeleton />

      <div className="mb-6 mt-12 border-b border-zinc-800" />
      <div className="flex items-center justify-between pb-8">
        <div className="h-5 w-36 animate-pulse bg-zinc-800" />
        <div className="h-5 w-36 animate-pulse bg-zinc-800" />
      </div>
    </div>
  );
}

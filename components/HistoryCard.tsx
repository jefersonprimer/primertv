import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export interface HistoryItem {
  id: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string | null;
  episodeImageUrl: string | null;
  episodePublicId?: string | null;
  episodeSlug?: string | null;
  seasonNumber: number;
  animeId: string;
  animeSlug: string;
  animeTitle: string;
  animeImageUrl: string | null;
  watchedAt: Date;
}

interface HistoryCardProps {
  item: HistoryItem;
  className?: string;
}

export function HistoryCard({
  item,
  className = "w-[260px] flex-shrink-0 sm:w-[300px] lg:w-[287.75px]",
}: HistoryCardProps) {
  const cardHref = item.episodePublicId
    ? `/watch/${item.episodePublicId}/${item.episodeSlug || "episodio-" + item.episodeNumber}`
    : `/watch/${item.episodeId}/${item.episodeSlug || "episodio-" + item.episodeNumber}`;
  const displayImageUrl = item.episodeImageUrl || item.animeImageUrl;

  return (
    <div className={`hover:bg-zinc-800 p-2 ${className}`}>
      <div className="group flex flex-col gap-2">
        <Link
          href={cardHref}
          className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10"
        >
          {/* Main Image */}
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt={`Episódio ${item.episodeNumber} de ${item.animeTitle}`}
              fill
              sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 287.75px"
              className="object-cover transition-transform duration-500"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#f2f2f2] hover:text-white text-base font-bold">
              {item.animeTitle}
            </div>
          )}

          {/* Season / Episode overlay badge */}
          <div className="absolute top-0 left-0 z-20 bg-black/75 backdrop-blur-xs text-[#f2f2f2] px-2 py-0.5 text-sm font-normal">
            T{item.seasonNumber} : EP {item.episodeNumber}
          </div>

          {/* Hover Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 scale-90 group-hover:scale-100">
              <Play className="h-6 w-6 fill-current ml-0.5" />
            </div>
          </div>
        </Link>

        <div className="flex flex-col gap-0.5 px-1">
          <Link href={cardHref}>
            <h3 className="flex h-full items-center text-[#f2f2f2] hover:text-white text-base font-bold line-clamp-2">
              {item.animeTitle}
            </h3>
          </Link>
          <Link
            href={cardHref}
            className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors flex items-center gap-1"
          >
            Continuar a assistir EP{item.episodeNumber}
          </Link>
        </div>
      </div>
    </div>
  );
}

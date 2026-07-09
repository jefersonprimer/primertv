import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

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
  isDubbed?: boolean;
  isSubtitled?: boolean;
}

interface HistoryCardProps {
  item: HistoryItem;
  className?: string;
  isMobileRow?: boolean;
}

export function HistoryCard({
  item,
  className = "",
  isMobileRow = false,
}: HistoryCardProps) {
  const t = useTranslations("History");
  const tMedia = useTranslations("MediaCard");
  const cardHref = item.episodePublicId
    ? `/watch/${item.episodePublicId}/${item.episodeSlug || "episode-" + item.episodeNumber}`
    : `/watch/${item.episodeId}/${item.episodeSlug || "episode-" + item.episodeNumber}`;
  const displayImageUrl = item.episodeImageUrl || item.animeImageUrl;

  if (isMobileRow) {
    const posterImageUrl = item.animeImageUrl || item.episodeImageUrl;

    return (
      <div className={`hover:bg-zinc-800 p-2 transition-colors ${className}`}>
        <div className="flex gap-4">
          <Link
            href={cardHref}
            className="relative aspect-[2/3] w-[84px] flex-shrink-0 overflow-hidden bg-zinc-900 shadow-md transition-all duration-300"
          >
            {posterImageUrl ? (
              <Image
                src={posterImageUrl}
                alt={t("episodeAlt", {
                  number: item.episodeNumber,
                  title: item.animeTitle,
                })}
                fill
                sizes="84px"
                className="object-cover transition-transform duration-500"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#f2f2f2] hover:text-white text-xs font-bold text-center p-1">
                {item.animeTitle}
              </div>
            )}

            {/* Hover Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 hover:opacity-100 z-10">
              <Play className="h-5 w-5 fill-current text-white" />
            </div>
          </Link>

          <div className="flex flex-col justify-between py-1 min-w-0">
            <div>
              <Link href={cardHref}>
                <h3 className="text-[#f2f2f2] hover:text-white text-sm font-bold line-clamp-2 hover:underline leading-tight">
                  {item.animeTitle}
                </h3>
              </Link>

              <div className="text-sm text-zinc-400 font-normal mt-0.5">
                {t("seasonEpisodeBadge", {
                  season: item.seasonNumber,
                  episode: item.episodeNumber,
                })}
              </div>

              <Link
                href={cardHref}
                className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors line-clamp-1"
              >
                {t("continueWatchingEp", { number: item.episodeNumber })}
              </Link>
            </div>

            {(item.isDubbed || item.isSubtitled) && (
              <div className="flex gap-1.5 self-start mt-1">
                {item.isDubbed && item.isSubtitled ? (
                  <span className="text-sm text-[#8c8c8c] font-normal">
                    {tMedia("subDub")}
                  </span>
                ) : item.isDubbed ? (
                  <span className="text-sm text-[#8c8c8c] font-normal">
                    {tMedia("dubbed")}
                  </span>
                ) : (
                  <span className="text-sm text-[#8c8c8c] font-normal">
                    {tMedia("subtitled")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex flex-col gap-2 hover:bg-zinc-800 md:p-2 transition-colors duration-200 ${className}`}
    >
      <Link
        href={cardHref}
        className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-500/10"
      >
        {/* Main Image */}
        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
            alt={t("episodeAlt", {
              number: item.episodeNumber,
              title: item.animeTitle,
            })}
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
          {t("seasonEpisodeBadge", {
            season: item.seasonNumber,
            episode: item.episodeNumber,
          })}
        </div>

        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 scale-90 group-hover:scale-100">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <Link href={cardHref}>
          <h3 className="text-[#f2f2f2] hover:text-white text-base font-bold line-clamp-2 hover:underline">
            {item.animeTitle}
          </h3>
        </Link>

        <Link
          href={cardHref}
          className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors flex items-center gap-1"
        >
          {t("continueWatchingEp", { number: item.episodeNumber })}
        </Link>

        {(item.isDubbed || item.isSubtitled) && (
          <div className="flex gap-1.5 self-start mt-2">
            {item.isDubbed && item.isSubtitled ? (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {tMedia("subDub")}
              </span>
            ) : item.isDubbed ? (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {tMedia("dubbed")}
              </span>
            ) : (
              <span className="text-sm text-[#8c8c8c] font-normal">
                {tMedia("subtitled")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

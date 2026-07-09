import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import Image from "next/image";
import RatingBadge from "@/components/RatingBadge";
import { Link } from "@/i18n/routing";

export interface FavoriteItem {
  id: string;
  slug: string;
  title: string;
  bannerUrl: string | null;
  animeImageUrl?: string | null;
  firstEpisodeId: string | null;
  firstEpisodeImageUrl: string | null;
  firstEpisodePublicId?: string | null;
  firstEpisodeSlug?: string | null;
  rating: string | null;
  duration: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
}

interface FavoriteCardProps {
  item: FavoriteItem;
  className?: string;
  isMobileRow?: boolean;
}

function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "";
  const matches = duration.match(/\d+/);
  if (matches) {
    return `${matches[0]}m`;
  }
  return duration;
}

export default function FavoriteCard({
  item,
  className = "",
  isMobileRow = false,
}: FavoriteCardProps) {
  const t = useTranslations("FavoriteCard");
  const tMedia = useTranslations("MediaCard");
  const cardHref = item.firstEpisodePublicId
    ? `/watch/${item.firstEpisodePublicId}/${item.firstEpisodeSlug || "episode-1"}`
    : `/animes/${item.slug}`;

  if (isMobileRow) {
    const posterImageUrl =
      item.animeImageUrl || item.bannerUrl || item.firstEpisodeImageUrl;

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
                alt={item.title}
                fill
                sizes="84px"
                className="object-cover transition-transform duration-500"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#f2f2f2] hover:text-white text-xs font-bold text-center p-1">
                {item.title}
              </div>
            )}

            {/* Rating Badge inside image */}
            {item.rating && (
              <div className="absolute top-1 left-1 z-20 shadow-md">
                <RatingBadge rating={item.rating} size={16} />
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
                  {item.title}
                </h3>
              </Link>

              {item.firstEpisodeId ? (
                <Link
                  href={cardHref}
                  className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors line-clamp-1 mt-2"
                >
                  {t("startWatchingEp", { number: 1 })}
                </Link>
              ) : (
                <Link
                  href={cardHref}
                  className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors line-clamp-1"
                >
                  {t("viewDetails")}
                </Link>
              )}
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
        className="relative aspect-video w-full overflow-hidden bg-zinc-900 shadow-md transition-shadow group-hover:shadow-xl group-hover:shadow-blue-500/10"
      >
        {/* Rating Badge in upper left */}
        {item.rating && (
          <div className="absolute top-1 left-1 z-20 shadow-md">
            <RatingBadge rating={item.rating} size={20} />
          </div>
        )}

        {/* Main Banner Image */}
        {item.bannerUrl ? (
          <Image
            src={item.bannerUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 287.75px"
            className={`object-cover transition-opacity duration-500 ${
              item.firstEpisodeImageUrl
                ? "opacity-100 group-hover:opacity-0"
                : ""
            }`}
          />
        ) : (
          !item.firstEpisodeImageUrl && (
            <div className="flex h-full items-center justify-center text-zinc-400 text-sm font-medium">
              {item.title}
            </div>
          )
        )}

        {/* Hover Episode Image */}
        {item.firstEpisodeImageUrl && (
          <Image
            src={item.firstEpisodeImageUrl}
            alt={t("firstEpisodeAlt", { title: item.title })}
            fill
            sizes="(max-width: 640px) 260px, (max-width: 1024px) 300px, 287.75px"
            className={`object-cover absolute inset-0 transition-opacity duration-500 ${
              item.bannerUrl
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100"
            }`}
          />
        )}

        {/* Duration Badge in bottom right on hover */}
        {item.duration && (
          <div className="absolute bottom-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 backdrop-blur-xs text-white px-2 py-0.5 text-sm font-semibold shadow-sm">
            {formatDuration(item.duration)}
          </div>
        )}

        {/* Hover Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform duration-300 scale-90 group-hover:scale-100">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <Link href={cardHref}>
          <h3 className="text-[#f2f2f2] hover:text-white text-base font-bold line-clamp-2 ahover:underline">
            {item.title}
          </h3>
        </Link>

        {item.firstEpisodeId ? (
          <Link
            href={cardHref}
            className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors flex items-center gap-1"
          >
            {t("startWatchingEp", { number: 1 })}
          </Link>
        ) : (
          <Link
            href={cardHref}
            className="text-sm text-[#bbb] font-medium hover:text-[#f2f2f2] transition-colors flex items-center gap-1"
          >
            {t("viewDetails")}
          </Link>
        )}

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

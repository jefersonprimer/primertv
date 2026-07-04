"use client";

import { useState } from "react";
import RatingBadge from "./RatingBadge";
import { Trophy } from "lucide-react";
import { useTranslations } from "next-intl";

interface MediaDescriptionProps {
  description: string;
  className?: string;
  rating?: string;
  genres?: string[];
  year?: number | null;
  awards?: string[];
  audio?: string[];
  subtitles?: string[];
}

export default function MediaDescription({
  description,
  className = "text-zinc-600 dark:text-white",
  rating,
  genres,
  year,
  awards,
  audio,
  subtitles,
}: MediaDescriptionProps) {
  const t = useTranslations("MediaDescription");
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 300;

  if (!description) return null;

  const shouldShowButton = description.length > maxLength;
  const displayedText = isExpanded
    ? description
    : description.slice(0, maxLength);

  const hasExtraInfo =
    rating ||
    (genres && genres.length > 0) ||
    year ||
    (awards && awards.length > 0) ||
    (audio && audio.length > 0) ||
    (subtitles && subtitles.length > 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full border-b-2 border-zinc-700 pb-4">
      {/* Description Column */}
      <div
        className={`flex flex-col gap-2 ${hasExtraInfo ? "flex-2 md:w-2/3" : "w-full"}`}
      >
        <p className={`${className} text-base font-normal leading-relaxed`}>
          {displayedText}
          {!isExpanded && shouldShowButton && "..."}
        </p>
        {shouldShowButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-500 hover:text-blue-600 text-sm font-bold self-start uppercase mt-1"
          >
            {isExpanded ? t("showLess") : t("showMore")}
          </button>
        )}
      </div>

      {/* Info Column */}
      {hasExtraInfo && (
        <div className="flex flex-col gap-4 flex-1 md:w-1/3 text-sm font-normal">
          {year && (
            <div>
              {t("year")}:{" "}
              <span className="text-zinc-700 dark:text-zinc-300">{year}</span>
            </div>
          )}
          {rating && (
            <div className="flex gap-1.5">
              {t("rating")}:
              <span>
                {rating && <RatingBadge rating={rating} className="h-4 w-4" />}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{rating}</span>
            </div>
          )}
          {genres && genres.length > 0 && (
            <div>
              {t("genres")}:{" "}
              {genres.map((genre, index) => (
                <span key={genre} className="text-zinc-700 dark:text-zinc-300">
                  <span className="underline">{genre}</span>
                  {index < genres.length - 1 && ", "}
                </span>
              ))}
            </div>
          )}
          {audio && audio.length > 0 && (
            <div>
              {t("audio")}:{" "}
              <span className="text-zinc-700 dark:text-zinc-300">
                {audio.join(", ")}
              </span>
            </div>
          )}
          {subtitles && subtitles.length > 0 && (
            <div>
              {t("subtitles")}:{" "}
              <span className="text-zinc-700 dark:text-zinc-300">
                {subtitles.join(", ")}
              </span>
            </div>
          )}
          {awards && awards.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500 animate-pulse" />
                {t("awards")}
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {awards.map((award) => (
                  <span
                    key={award}
                    className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 border border-amber-500/20 shadow-sm transition hover:scale-105 duration-200"
                  >
                    {award}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

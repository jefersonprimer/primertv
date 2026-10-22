"use client";

import { useState } from "react";
import { Star, ChevronDown } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { rateAnime, AnimeRatingStats } from "@/app/actions/animeRating";
import { StarRatingModal } from "./StarRatingModal";

interface AnimeStarRatingProps {
  animeId: string;
  animeTitle: string;
  initialStats: AnimeRatingStats;
  isLoggedIn: boolean;
}

export function AnimeStarRating({
  animeId,
  animeTitle,
  initialStats,
  isLoggedIn,
}: AnimeStarRatingProps) {
  const t = useTranslations("StarRating");
  const format = useFormatter();

  const [stats, setStats] = useState<AnimeRatingStats>(initialStats);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRate = async (score: number) => {
    if (!isLoggedIn) {
      setIsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rateAnime(animeId, score);
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error("Failed to rate anime:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDisplayScore =
    hoverScore ?? stats.userScore ?? Math.round(stats.averageScore);

  const hasCommunityScore = stats.totalVotes > 0 && stats.averageScore > 0;

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
        {/* Interactive Star Row */}
        <div
          className="flex items-center gap-1 cursor-pointer group"
          onMouseLeave={() => setHoverScore(null)}
          onClick={() => setIsModalOpen(true)}
          title={t("clickForStats", {
            defaultValue: "Clique para ver estatísticas de votos",
          })}
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const score = i + 1;
            const isFilled = score <= activeDisplayScore;
            return (
              <button
                key={score}
                type="button"
                disabled={isSubmitting}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  setHoverScore(score);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRate(score);
                }}
                className="p-0.5 focus:outline-none transition-transform hover:scale-125 disabled:opacity-50"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    isFilled
                      ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

       

        {/* Right side: Average score & total votes (clickable for modal) */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-zinc-200 transition-all hover:scale-105 active:scale-95 text-xs font-semibold"
          title={t("viewStats", {
            defaultValue: "Ver gráfico de avaliações",
          })}
        >
          <span className="text-white font-medium text-sm tabular-nums">
            {hasCommunityScore
              ? format.number(stats.averageScore, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })
              : t("noScore", { defaultValue: "N/A" })}
          </span>
          {stats.totalVotes > 0 && (
            <span className="text-white font-normal tabular-nums">
              ({format.number(stats.totalVotes)})
            </span>
          )}
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Modal */}
      <StarRatingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        animeTitle={animeTitle}
        stats={stats}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}

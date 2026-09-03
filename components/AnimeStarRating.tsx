"use client";

import { useState } from "react";
import { Star, BarChart2, ChevronDown } from "lucide-react";
import {
  rateAnime,
  AnimeRatingStats,
  RatingBreakdown,
} from "@/app/actions/animeRating";
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

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
        {/* Interactive Star Row */}
        <div
          className="flex items-center gap-1 cursor-pointer group"
          onMouseLeave={() => setHoverScore(null)}
          onClick={() => setIsModalOpen(true)}
          title="Clique para ver estatísticas de votos"
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
                  className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${
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
          className="flex items-center gap-1.5 text-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-sm text-xs font-semibold"
          title="Ver gráfico de avaliações"
        >
          <span className="text-white font-medium text-sm">
            {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "N/A"}
          </span>
          {stats.totalVotes > 0 && (
            <span className="text-white font-normal">
              ({stats.totalVotes.toLocaleString()} )
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
        averageScore={stats.averageScore}
        totalVotes={stats.totalVotes}
        userScore={stats.userScore}
        breakdown={stats.breakdown}
        onRate={handleRate}
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}

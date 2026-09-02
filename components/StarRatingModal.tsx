"use client";

import { useState } from "react";
import { Star, X, Check } from "lucide-react";
import { RatingBreakdown } from "@/app/actions/animeRating";
import { useTranslations } from "next-intl";

interface StarRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  averageScore: number;
  totalVotes: number;
  userScore: number | null;
  breakdown: RatingBreakdown[];
  onRate: (score: number) => Promise<void>;
  isLoggedIn: boolean;
}

export function StarRatingModal({
  isOpen,
  onClose,
  animeTitle,
  averageScore,
  totalVotes,
  userScore,
  breakdown,
  onRate,
  isLoggedIn,
}: StarRatingModalProps) {
  const t = useTranslations("StarRating");
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStarClick = async (score: number) => {
    if (!isLoggedIn) return;
    setIsSubmitting(true);
    try {
      await onRate(score);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreLabel = (score: number) => {
    switch (score) {
      case 10:
        return t("masterpiece", { defaultValue: "Obra-prima" });
      case 9:
        return t("excellent", { defaultValue: "Excelente" });
      case 8:
        return t("veryGood", { defaultValue: "Muito Bom" });
      case 7:
        return t("good", { defaultValue: "Bom" });
      case 6:
        return t("fine", { defaultValue: "Legal" });
      case 5:
        return t("average", { defaultValue: "Mediano" });
      case 4:
        return t("bad", { defaultValue: "Ruim" });
      case 3:
        return t("veryBad", { defaultValue: "Muito Ruim" });
      case 2:
        return t("horrible", { defaultValue: "Péssimo" });
      case 1:
        return t("appalling", { defaultValue: "Insuportável" });
      default:
        return "";
    }
  };

  const activeStarRating = hoverScore ?? userScore ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <div>
            <h3 className="text-lg font-bold text-white line-clamp-1">
              {animeTitle}
            </h3>
            <p className="text-xs text-zinc-400">
              {t("evaluationStats", { defaultValue: "Estatísticas de Avaliações" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Average Rating Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-zinc-900 border border-blue-900/30">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-blue-400">
                {averageScore.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-zinc-400">/ 10</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white">
                {totalVotes.toLocaleString()} {t("votes", { defaultValue: "votos" })}
              </div>
              <p className="text-xs text-zinc-400">
                {t("communityAverage", { defaultValue: "Média da comunidade" })}
              </p>
            </div>
          </div>

          {/* Breakdown Bars (10 -> 1) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              {t("distribution", { defaultValue: "Distribuição das notas" })}
            </h4>
            {breakdown.map((item) => (
              <div key={item.score} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-12 font-semibold text-zinc-300 shrink-0">
                  <span>{item.score}</span>
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {/* Count & Percentage */}
                <div className="w-24 text-right text-xs shrink-0 flex justify-end gap-1.5 font-medium">
                  <span className="text-white font-bold">{item.percentage}%</span>
                  <span className="text-zinc-500">({item.count})</span>
                </div>
              </div>
            ))}
          </div>

          {/* User Voting Section */}
          <div className="pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              {userScore
                ? t("yourVote", { defaultValue: "Sua avaliação" })
                : t("rateThisAnime", { defaultValue: "Avalie este anime" })}
            </h4>

            {isLoggedIn ? (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                {/* 10 Stars */}
                <div
                  className="flex items-center gap-1 sm:gap-1.5"
                  onMouseLeave={() => setHoverScore(null)}
                >
                  {Array.from({ length: 10 }).map((_, i) => {
                    const score = i + 1;
                    const isFilled = score <= activeStarRating;
                    return (
                      <button
                        key={score}
                        type="button"
                        disabled={isSubmitting}
                        onMouseEnter={() => setHoverScore(score)}
                        onClick={() => handleStarClick(score)}
                        className="p-0.5 focus:outline-none transition-transform hover:scale-125 disabled:opacity-50"
                        title={`${score}/10 - ${getScoreLabel(score)}`}
                      >
                        <Star
                          size={24}
                          className={`transition-colors ${
                            isFilled
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                              : "text-zinc-600 hover:text-zinc-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating description */}
                <div className="h-5 text-sm font-semibold text-amber-400 flex items-center gap-2">
                  {activeStarRating > 0 ? (
                    <>
                      <span>
                        {activeStarRating} / 10 - {getScoreLabel(activeStarRating)}
                      </span>
                      {userScore === activeStarRating && hoverScore === null && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-400 font-normal">
                          <Check size={14} /> {t("saved", { defaultValue: "Votado" })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-zinc-500 font-normal">
                      {t("clickToRate", { defaultValue: "Clique em uma estrela para votar" })}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center space-y-2">
                <p className="text-sm text-zinc-300">
                  {t("loginRequired", {
                    defaultValue: "Faça login para registrar sua nota e contribuir para a média.",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

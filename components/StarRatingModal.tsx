"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, X, Check, Award, Users } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleStarClick = async (score: number) => {
    if (!isLoggedIn || isSubmitting) return;
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

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden bg-zinc-900/95 border border-zinc-800/80 rounded-3xl shadow-2xl shadow-black/60 text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award size={16} />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              {t("evaluationStats", {
                defaultValue: "Estatísticas de Avaliações",
              })}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-7 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Hero Score Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-850 via-zinc-900 to-zinc-950 p-5 border border-zinc-800/80 shadow-inner">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
                  <Award size={28} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {averageScore.toFixed(1)}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400">
                      / 10
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium">
                    {t("communityAverage", {
                      defaultValue: "Média da comunidade",
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800/60 rounded-full border border-zinc-700/50 text-xs font-semibold text-zinc-200">
                  <Users size={14} className="text-zinc-400" />
                  <span>{totalVotes.toLocaleString()}</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {t("votes", { defaultValue: "votos computados" })}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Bars (IMDb Style) */}
          <div className="py-2 space-y-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {t("distribution", { defaultValue: "Distribuição das notas" })}
              </h4>
            </div>

            {breakdown.map((item) => {
              const hasVotes = item.count > 0;
              return (
                <div
                  key={item.score}
                  className="flex items-center gap-3 text-sm py-1.5 px-1 rounded-md hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Score Number (Larger & Bold) */}
                  <span className="w-6 font-bold text-zinc-100 text-right text-sm shrink-0">
                    {item.score}
                  </span>

                  {/* Progress Bar (Increased height: h-3.5) */}
                  <div className="flex-1 h-3.5 bg-zinc-800/90 rounded-sm overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${
                        hasVotes ? "bg-white" : "bg-transparent"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  {/* Percentage & Vote Count (Matching size & white color) */}
                  <div className="w-24 text-right shrink-0 flex items-center justify-end gap-1.5 font-mono">
                    <span
                      className={`font-normal text-sm ${hasVotes ? "text-white" : "text-zinc-500"}`}
                    >
                      {item.percentage}%
                    </span>
                    <span
                      className={`font-normal text-sm ${hasVotes ? "text-white" : "text-zinc-500"}`}
                    >
                      ({item.count.toLocaleString()})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User Voting Section */}
          <div className="pt-5 border-t border-zinc-800/80">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              {userScore
                ? t("yourVote", { defaultValue: "Sua avaliação" })
                : t("rateThisAnime", { defaultValue: "Avalie este anime" })}
            </h4>

            {isLoggedIn ? (
              <div className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-sm relative overflow-hidden">
                {/* Subtle Amber Glow when interacting */}
                {activeStarRating > 0 && (
                  <div className="absolute inset-0 bg-amber-500/5 blur-xl pointer-events-none transition-opacity duration-300" />
                )}

                {/* 10 Stars */}
                <div
                  className="flex items-center justify-center gap-1 sm:gap-1.5 relative z-10"
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
                        className="p-1 focus:outline-none transition-all duration-150 transform hover:scale-125 active:scale-95 disabled:opacity-50"
                        title={`${score}/10 - ${getScoreLabel(score)}`}
                      >
                        <Star
                          size={24}
                          className={`transition-colors duration-150 ${
                            isFilled
                              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]"
                              : "text-zinc-700 hover:text-zinc-500"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating description */}
                <div className="h-6 text-sm font-semibold text-amber-400 flex items-center gap-2 relative z-10">
                  {activeStarRating > 0 ? (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150">
                      <span className="bg-amber-400/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {activeStarRating} / 10
                      </span>
                      <span className="text-zinc-200 font-medium text-xs">
                        {getScoreLabel(activeStarRating)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 font-medium">
                      {t("clickToRate", {
                        defaultValue: "Clique em uma estrela para votar",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center space-y-2">
                <p className="text-xs text-zinc-400">
                  {t("loginRequired", {
                    defaultValue:
                      "Faça login para registrar sua nota e contribuir para a média da comunidade.",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

"use client";

import { useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/routing";
import { Star, X } from "lucide-react";
import type {
  AnimeRatingStats,
  RatingBreakdown,
} from "@/app/actions/animeRating";
import { useFormatter, useTranslations } from "next-intl";

interface StarRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
  stats: AnimeRatingStats;
  isLoggedIn: boolean;
}

const MAX_STARS = 10;

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function StarRow({ ratio, size = 18 }: { ratio: number; size?: number }) {
  const width = clamp(ratio * 100, 0, 100);

  return (
    <span className="relative inline-flex" aria-hidden="true">
      <span className="flex gap-1">
        {Array.from({ length: MAX_STARS }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className="shrink-0 text-zinc-700"
          />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${width}%` }}
      >
        <span className="flex gap-1">
          {Array.from({ length: MAX_STARS }).map((_, i) => (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className="shrink-0 fill-amber-400 text-amber-400"
            />
          ))}
        </span>
      </span>
    </span>
  );
}

export function StarRatingModal({
  isOpen,
  onClose,
  animeTitle,
  stats,
  isLoggedIn,
}: StarRatingModalProps) {
  const t = useTranslations("StarRating");
  const format = useFormatter();
  const titleId = useId();

  const panelRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  const { averageScore, totalVotes, breakdown, userScore, mostVotedScore } =
    stats;

  const hasVotes = totalVotes > 0;

  const distribution = useMemo(
    () => [...breakdown].sort((a, b) => b.score - a.score),
    [breakdown],
  );

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center bg-black/85 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-zinc-950 ring-1 ring-zinc-800/80 shadow-2xl shadow-black/70 outline-none animate-zoom-in-95 motion-reduce:animate-none sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-400/80 uppercase">
              {t("evaluationStats", {
                defaultValue: "Estatísticas de Avaliações",
              })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("close", { defaultValue: "Fechar" })}
            className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none"
          >
            <X size={24} />
          </button>
        </div>

        {!hasVotes ? (
          /* Empty state */
          <div className="border-t border-zinc-800/70 px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
              <Star size={22} className="text-zinc-600" />
            </div>
            <p className="mt-4 text-sm font-semibold text-zinc-200">
              {t("noVotesTitle", {
                defaultValue: "Nenhuma avaliação ainda",
              })}
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-zinc-500">
              {t("noVotesDescription", {
                defaultValue:
                  "Seja a primeira pessoa a avaliar este anime e ajudar a comunidade a encontrar as melhores obras.",
              })}
            </p>
          </div>
        ) : (
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Average */}
            <div className="border-t border-zinc-800/70 px-5 py-6 text-center sm:px-6">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                {t("communityAverage", {
                  defaultValue: "Média da comunidade",
                })}
              </p>

              <div
                className="mt-2 flex items-end justify-center gap-1.5"
                aria-label={`${averageScore.toFixed(1)} ${t("outOfStars", { max: MAX_STARS })}`}
              >
                <span className="text-5xl leading-none font-bold tabular-nums text-white">
                  {format.number(averageScore, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span className="pb-1 text-sm font-medium text-zinc-500">
                  / {MAX_STARS}
                </span>
              </div>

              <div className="mt-3 flex justify-center">
                <StarRow ratio={averageScore / MAX_STARS} />
              </div>

              <p className="mt-3 text-sm text-zinc-400">
                {t("ratings", { count: totalVotes })}
              </p>
            </div>

            {/* Your rating */}
            {userScore !== null && (
              <div className="border-t border-zinc-800/70 px-5 py-3 sm:px-6">
                <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-400/[0.06] px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <Star
                      size={12}
                      className="shrink-0 fill-amber-400 text-amber-400"
                    />
                    {t("yourVote", { defaultValue: "Sua avaliação" })}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-white">
                    {userScore}
                    <span className="font-medium text-zinc-500">
                      {" "}
                      / {MAX_STARS}
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Distribution */}
            <div className="border-t border-zinc-800/70 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500 uppercase">
                  {t("distribution", {
                    defaultValue: "Distribuição das notas",
                  })}
                </h3>
                <span className="text-[10px] text-zinc-600">
                  {t("distributionHint", {
                    defaultValue: "notas e % dos votos",
                  })}
                </span>
              </div>

              <ul className="mt-3 space-y-0.5">
                {distribution.map((item: RatingBreakdown) => {
                  const hasItemVotes = item.count > 0;
                  const isMostVoted =
                    mostVotedScore !== null && item.score === mostVotedScore;

                  return (
                    <li
                      key={item.score}
                      className={`flex items-center gap-3 rounded-md px-1.5 py-1.5 ${
                        isMostVoted ? "bg-zinc-900/70" : ""
                      }`}
                    >
                      <span
                        className={`flex w-7 shrink-0 items-center gap-1 text-xs font-semibold tabular-nums ${
                          hasItemVotes ? "text-zinc-300" : "text-zinc-600"
                        }`}
                      >
                        <Star
                          size={11}
                          className={
                            hasItemVotes
                              ? "fill-amber-400 text-amber-400"
                              : "fill-zinc-800 text-zinc-800"
                          }
                        />
                        {item.score}
                      </span>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800/70">
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                            hasItemVotes ? "bg-amber-400" : "bg-transparent"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>

                      <span
                        className={`w-10 shrink-0 text-right text-xs font-medium tabular-nums ${
                          hasItemVotes ? "text-zinc-300" : "text-zinc-600"
                        }`}
                      >
                        {item.percentage}%
                      </span>

                      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                        {format.number(item.count)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* CTA */}
        {!isLoggedIn && (
          <div className="border-t border-zinc-800/70 bg-zinc-900/30 px-5 py-4 sm:px-6">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:outline-none"
            >
              {t("loginToRate", {
                defaultValue: "Faça login para avaliar este anime",
              })}
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

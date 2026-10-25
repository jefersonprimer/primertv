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
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[#111214] text-white ring-1 ring-white/10 shadow-2xl shadow-black/60 outline-none animate-zoom-in-95 motion-reduce:animate-none sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0">
            <p id={titleId} className="truncate text-base font-semibold tracking-tight text-white">
              {animeTitle}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {t("evaluationStats", { defaultValue: "Estatísticas de avaliações" })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("close", { defaultValue: "Fechar" })}
            className="-mt-1 -mr-1 shrink-0 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none"
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
            <div className="border-y border-white/[0.08] px-5 py-6 sm:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                  <Star size={27} className="fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-300">
                    {t("communityAverage", { defaultValue: "Média da comunidade" })}
                  </p>
                  <div
                    className="mt-1 flex items-baseline gap-1.5"
                    aria-label={`${averageScore.toFixed(1)} ${t("outOfStars", { max: MAX_STARS })}`}
                  >
                    <span className="text-4xl leading-none font-semibold tracking-tight tabular-nums text-white">
                      {format.number(averageScore, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {t("outOfStars", { max: MAX_STARS })}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {t("ratings", { count: totalVotes })}
                  </p>
                </div>
              </div>
            </div>

            {/* Your rating */}
            {userScore !== null && (
              <div className="border-b border-white/[0.08] px-5 py-3 sm:px-6">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3.5 py-3">
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
            <div className="px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-200">
                  {t("distribution", {
                    defaultValue: "Distribuição das notas",
                  })}
                </h3>
                <span className="text-[11px] text-zinc-500">
                  {t("distributionHint", {
                    defaultValue: "notas e % dos votos",
                  })}
                </span>
              </div>

              <ul className="mt-3 space-y-1">
                {distribution.map((item: RatingBreakdown) => {
                  const hasItemVotes = item.count > 0;
                  const isMostVoted =
                    mostVotedScore !== null && item.score === mostVotedScore;

                  return (
                    <li
                      key={item.score}
                      className={`flex items-center gap-3 rounded-lg px-2 py-2 ${
                        isMostVoted ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      <span
                        className={`flex w-7 shrink-0 items-center gap-1 text-xs font-semibold tabular-nums ${
                          hasItemVotes ? "text-zinc-200" : "text-zinc-600"
                        }`}
                      >
                        <Star
                          size={11}
                          className={
                            hasItemVotes
                              ? "fill-amber-300 text-amber-300"
                              : "fill-zinc-800 text-zinc-800"
                          }
                        />
                        {item.score}
                      </span>

                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                            hasItemVotes ? "bg-amber-300" : "bg-transparent"
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
          <div className="border-t border-white/[0.08] px-5 py-4 sm:px-6">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-200 focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:outline-none"
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

"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Image from "next/image";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import { StartWatchingButton } from "@/components/StartWatchingButton";
import Link from "next/link";

export interface HeroCarouselItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  genres: string[];
  rating: string | null;
  firstEpisodeId: string | null;
  firstEpisodePublicId?: string | null;
  firstEpisodeSlug?: string | null;
  inWatchlist: boolean;
  type?: "anime" | "series" | "movie";
  videoUrl?: string | null;
  tmdbId?: string | null;
  imdbId?: string | null;
  publicId?: string | null;
  isDubbed?: boolean;
  isSubtitled?: boolean;
  anilistId?: number | null;
  malId?: number | null;
}

interface HeroCarouselClientProps {
  items: HeroCarouselItem[];
  isLoggedIn: boolean;
}

export function HeroCarouselClient({
  items,
  isLoggedIn,
}: HeroCarouselClientProps) {
  const t = useTranslations("Buttons");
  const tMedia = useTranslations("MediaCard");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % items.length) + items.length) % items.length);
    },
    [items.length],
  );

  const goNext = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(goNext, 10000);
    return () => clearInterval(id);
  }, [isPaused, goNext]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goNext();
    } else if (isRightSwipe) {
      goPrev();
    }
  };

  const current = items[currentIndex];
  const detailUrl = current
    ? current.type === "series"
      ? `/series/${current.slug}`
      : current.type === "movie"
        ? `/movies/${current.slug}`
        : `/animes/${current.slug}`
    : "";

  return (
    <section
      className="relative aspect-[2/3] md:aspect-auto md:h-[95vh] lg:h-screen 2xl:h-[calc(100vh-4rem)] w-full overflow-hidden bg-zinc-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
        @media (max-width: 639px) {
          .mobile-bottom-blur {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 320px;
            pointer-events: none;
            background: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.8) 100%, rgba(0, 0, 0, 0.15) 75%, transparent 100%);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            mask-image: linear-gradient(to top, black 25%, transparent 100%);
            -webkit-mask-image: linear-gradient(to top, black 25%, transparent 100%);
          }
        }
      `}</style>

      {items.map((item, index) => (
        <div
          key={item.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: index === currentIndex ? 1 : 0 }}
        >
          {item.imageUrl && (
            <>
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="100vw"
                className="object-cover blur-xl opacity-40 scale-105 md:hidden"
                priority={index === 0}
              />
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="100vw"
                className="object-cover md:hidden opacity-100"
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
              />
            </>
          )}
          {item.bannerUrl && (
            <>
              <Image
                src={item.bannerUrl}
                alt=""
                fill
                sizes="100vw"
                className="hidden object-cover blur-xl opacity-40 scale-105 md:block"
                priority={index === 0}
              />
              <Image
                src={item.bannerUrl}
                alt={item.title}
                fill
                sizes="100vw"
                className="hidden object-cover object-top opacity-100 md:block"
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
              />
            </>
          )}
        </div>
      ))}

      {/* Mobile gradient overlay for poster readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent md:hidden" />
      {/* Left Gradient (occupies 45% of the width, ultra-natural eased scrim gradient) */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[45%] hidden md:block dark:hidden"
        style={{
          background:
            "linear-gradient(to right, #fafafa 0%, rgba(250, 250, 250, 0.85) 25%, rgba(250, 250, 250, 0.6) 50%, rgba(250, 250, 250, 0.3) 75%, rgba(250, 250, 250, 0.1) 90%, rgba(250, 250, 250, 0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[45%] hidden dark:md:block"
        style={{
          background:
            "linear-gradient(to right, #000 0%, rgba(0, 0, 0, 0.85) 25%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.3) 75%, rgba(0, 0, 0, 0.1) 90%, rgba(0, 0, 0, 0) 100%)",
        }}
      />
      {/* Right Gradient (occupies 20% of the width, ultra-natural eased scrim gradient) */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[20%] hidden md:block dark:hidden"
        style={{
          background:
            "linear-gradient(to left, #fafafa 0%, rgba(250, 250, 250, 0.7) 20%, rgba(250, 250, 250, 0.45) 40%, rgba(250, 250, 250, 0.25) 60%, rgba(250, 250, 250, 0.1) 80%, rgba(250, 250, 250, 0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[20%] hidden dark:md:block"
        style={{
          background:
            "linear-gradient(to left, #000 0%, rgba(0, 0, 0, 0.7) 20%, rgba(0, 0, 0, 0.45) 40%, rgba(0, 0, 0, 0.25) 60%, rgba(0, 0, 0, 0.1) 80%, rgba(0, 0, 0, 0) 100%)",
        }}
      />
      {/* Bottom Gradient for sm and larger */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-68 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black hidden sm:block" />

      {/* Mobile bottom blur & gradient overlay for screens < sm */}
      <div className="mobile-bottom-blur sm:hidden" />

      <div className="absolute inset-0 flex items-end pb-6 sm:pb-14 md:pb-[24px] md:items-center">
        <div className="mx-auto w-full max-w-[1223px] 2xl:max-w-[1500px] md:px-10 lg:px-16 xl:px-0 2xl:px-12 md:-translate-y-20 lg:-translate-y-20 2xl:-translate-y-16">
          <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left space-y-4 md:max-w-xl 2xl:max-w-2xl 2xl:space-y-6">
            {current.logoUrl ? (
              <Link
                href={detailUrl}
                className="relative block aspect-[3/1] w-full max-w-[200px] sm:max-w-[280px] md:max-w-[340px] lg:max-w-[400px] 2xl:max-w-[480px] mx-auto md:mx-0 hover:opacity-90 transition-opacity"
              >
                <Image
                  src={current.logoUrl}
                  alt={current.title}
                  fill
                  priority
                  className="object-contain"
                />
                <h1 className="sr-only">{current.title}</h1>
              </Link>
            ) : (
              <h1 className="text-2xl font-bold text-white md:text-zinc-900 dark:text-zinc-50 md:text-[34px] 2xl:text-[44px] line-clamp-2 w-full max-w-[260px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[440px] 2xl:max-w-[520px] mx-auto md:mx-0 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                <Link href={detailUrl}>{current.title}</Link>
              </h1>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 2xl:gap-2">
              {current.rating && (
                <RatingBadge rating={current.rating} size={20} />
              )}

              {current?.type === "anime" &&
                (current.isDubbed || current.isSubtitled) && (
                  <div className="flex gap-1.5 self-start">
                    {current.isDubbed && current.isSubtitled ? (
                      <span className="text-sm 2xl:text-base text-[#8c8c8c]">
                        {tMedia("subDub")}
                      </span>
                    ) : current.isDubbed ? (
                      <span className="text-sm 2xl:text-base text-[#8c8c8c]">
                        {tMedia("dubbed")}
                      </span>
                    ) : (
                      <span className="text-sm 2xl:text-base text-[#8c8c8c]">
                        {tMedia("subtitled")}
                      </span>
                    )}
                  </div>
                )}

              {current.genres.length > 0 && (
                <>
                  <span
                    className="text-[#8c8c8c] flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <svg className="h-2 w-2 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2L22 12L12 22L2 12Z" />
                    </svg>
                  </span>
                  <span className="text-sm 2xl:text-base text-[#8c8c8c]">
                    {current.genres.join(", ")}
                  </span>
                </>
              )}
            </div>

            {current.description && (
              <p className="hidden lg:line-clamp-4 2xl:line-clamp-5 leading-relaxed text-[#bbb] max-w-[380px] 2xl:max-w-[540px] 2xl:text-base">
                {current.description}
              </p>
            )}

            <div className="flex items-center justify-center md:justify-start gap-3 2xl:gap-4 pt-1 2xl:pt-2">
              {current.type === "movie" &&
              (current.videoUrl || current.tmdbId) ? (
                <StartWatchingButton
                  href={
                    current.publicId
                      ? `/watch/${current.publicId}/${current.slug}`
                      : `/movies/${current.slug}/watch`
                  }
                  className="w-full max-w-[340px] md:max-w-[410px] 2xl:max-w-[460px] px-4 text-sm 2xl:text-base md:w-auto sm:max-w-none md:px-6 2xl:px-8 2xl:py-3"
                  text="Assistir"
                />
              ) : current.firstEpisodeId ? (
                <StartWatchingButton
                  href={
                    current.firstEpisodePublicId
                      ? `/watch/${current.firstEpisodePublicId}/${current.firstEpisodeSlug || "episode-1"}`
                      : `/watch/${current.firstEpisodeId}/${current.firstEpisodeSlug || "episode-1"}`
                  }
                  className="w-full max-w-[340px] md:max-w-[410px] 2xl:max-w-[460px] px-4 text-sm 2xl:text-base md:w-auto sm:max-w-none md:px-6 2xl:px-8 2xl:py-3"
                />
              ) : current.type === "anime" &&
                (current.anilistId || current.malId) ? (
                <StartWatchingButton
                  href={`/watch/${current.slug}/episode-1?source=megaplay&episode=1&season=1`}
                  className="w-full max-w-[340px] md:max-w-[410px] 2xl:max-w-[460px] px-4 text-sm 2xl:text-base md:w-auto sm:max-w-none md:px-6 2xl:px-8 2xl:py-3"
                />
              ) : current.type === "series" &&
                (current.tmdbId || current.imdbId) ? (
                <StartWatchingButton
                  href={`/watch/${current.slug}/episode-1?season=1&episode=1&source=vidnest`}
                  className="w-full max-w-[340px] md:max-w-[410px] 2xl:max-w-[460px] px-4 text-sm 2xl:text-base md:w-auto sm:max-w-none md:px-6 2xl:px-8 2xl:py-3"
                />
              ) : (
                <Link
                  href={detailUrl}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 p-2.5 px-4 shadow-lg backdrop-blur-md transition-all duration-200 focus:outline-none text-white text-sm 2xl:text-base font-medium uppercase w-full max-w-[340px] md:max-w-[410px] 2xl:max-w-[460px] px-4 md:w-auto sm:max-w-none md:px-6 2xl:px-8 2xl:py-3"
                >
                  <Info className="h-4 w-4 2xl:h-5 2xl:w-5 text-white group-hover:text-white transition-transform duration-200 group-hover:scale-110" />
                  <span>{t("viewDetails")}</span>
                </Link>
              )}
              {current.type !== "movie" ? (
                <WatchlistButton
                  mediaType={current.type === "series" ? "SERIES" : "ANIME"}
                  mediaId={current.id}
                  slug={current.slug}
                  initialInWatchlist={current.inWatchlist}
                  isLoggedIn={isLoggedIn}
                  size={24}
                />
              ) : (
                <WatchlistButton
                  mediaType="SERIES"
                  mediaId={current.id}
                  slug={current.slug}
                  initialInWatchlist={false}
                  isLoggedIn={false}
                  size={24}
                />
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 pt-4 md:pt-6 lg:pt-8 2xl:pt-10">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => goTo(index)}
                  className="h-2 2xl:h-2.5 overflow-hidden rounded-full bg-white/40 transition-all duration-500"
                  style={{ width: index === currentIndex ? 48 : 24 }}
                  aria-label={`Ir para ${item.title}`}
                >
                  {index === currentIndex && (
                    <span
                      key={currentIndex}
                      className="block h-full rounded-full bg-white"
                      style={{ animation: "progress-fill 10s linear forwards" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={goPrev}
        className="absolute left-0 top-1/3 z-20 hidden h-10 w-10 md:-translate-y-2/3 lg:-translate-y-1/3 items-center justify-center text-[#bbb] hover:text-white transition-all md:flex lg:left-2 2xl:left-6 md:h-12 md:w-12 2xl:h-16 2xl:w-16"
        aria-label={
          current.type === "series" ? "Série anterior" : "Anime anterior"
        }
      >
        <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 2xl:w-14 2xl:h-14" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-0 top-1/3 z-20 hidden h-10 w-10 md:-translate-y-2/3 lg:-translate-y-1/3 items-center justify-center text-[#bbb] hover:text-white transition-all md:flex lg:right-2 2xl:right-6 md:h-12 md:w-12 2xl:h-16 2xl:w-16"
        aria-label={
          current.type === "series" ? "Próxima série" : "Próximo anime"
        }
      >
        <ChevronRight className="w-8 h-8 lg:w-10 lg:h-10 2xl:w-14 2xl:h-14" />
      </button>
    </section>
  );
}

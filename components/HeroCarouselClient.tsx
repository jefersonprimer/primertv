"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import RatingBadge from "@/components/RatingBadge";
import { WatchlistButton } from "@/components/WatchlistButton";
import { StartWatchingButton } from "@/components/StartWatchingButton";
import { useTranslations } from "next-intl";

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
  publicId?: string | null;
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
        ? `/filmes/${current.slug}`
        : `/animes/${current.slug}`
    : "";

  return (
    <section
      className="relative h-[70vh] sm:h-screen md:h-[80vh] lg:h-screen w-full overflow-hidden bg-zinc-900"
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
            height: 480px;
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
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="100vw"
              className="object-cover md:hidden"
              priority={index === 0}
            />
          )}
          {item.bannerUrl && (
            <Image
              src={item.bannerUrl}
              alt={item.title}
              fill
              sizes="100vw"
              className="hidden object-cover md:block"
              priority={index === 0}
            />
          )}
        </div>
      ))}

      {/* Mobile gradient overlay for poster readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent md:hidden" />
      {/* Left Gradient */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-black/90 hidden md:block" />
      {/* Right Gradient */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[10%] bg-gradient-to-l from-zinc-50/50 to-transparent dark:from-black/50 hidden md:block" />
      {/* Bottom Gradient for sm and larger */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-zinc-50 to-transparent dark:from-black hidden sm:block" />

      {/* Mobile bottom blur & gradient overlay for screens < sm */}
      <div className="mobile-bottom-blur sm:hidden" />

      <div className="absolute inset-0 flex items-end pb-30 sm:pb-14 md:pb-[24px] md:items-center">
        <div className="mx-auto w-full max-w-[1223px] md:px-10 lg:px-16 xl:px-0 lg:-translate-y-20">
          <div className="max-w-lg mx-auto md:mx-0 text-center md:text-left space-y-4 md:max-w-xl">
            {current.logoUrl ? (
              <Link
                href={detailUrl}
                className="relative block aspect-[3/1] w-full max-w-[200px] mx-auto md:mx-0 md:max-w-[400px] hover:opacity-90 transition-opacity"
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
              <h1 className="text-2xl font-bold text-white md:text-zinc-900 dark:text-zinc-50 md:text-[34px] line-clamp-2 md:max-w-[380px] hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                <Link href={detailUrl}>{current.title}</Link>
              </h1>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
              {current.rating && (
                <RatingBadge rating={current.rating} size={20} />
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
                  <span className="text-sm font-normal text-[#8c8c8c]">
                    {current.genres.join(", ")}
                  </span>
                </>
              )}
            </div>

            {current.description && (
              <p className="hidden lg:line-clamp-4 text-base font-normal leading-relaxed text-[#bbb] max-w-[380px]">
                {current.description}
              </p>
            )}

            <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
              {current.type === "movie" &&
              (current.videoUrl || current.tmdbId) ? (
                <StartWatchingButton
                  href={
                    current.publicId
                      ? `/watch/${current.publicId}/${current.slug}`
                      : `/filmes/${current.slug}/watch`
                  }
                  className="w-full max-w-[340px] md:max-w-[410px] px-4 text-sm md:w-auto sm:max-w-none md:px-6"
                  text="Assistir"
                />
              ) : current.firstEpisodeId ? (
                <StartWatchingButton
                  href={
                    current.firstEpisodePublicId
                      ? `/watch/${current.firstEpisodePublicId}/${current.firstEpisodeSlug || "episode-1"}`
                      : `/watch/${current.firstEpisodeId}/${current.firstEpisodeSlug || "episode-1"}`
                  }
                  className="w-full max-w-[340px] md:max-w-[410px] px-4 text-sm md:w-auto sm:max-w-none md:px-6"
                />
              ) : (
                <Link
                  href={detailUrl}
                  className="flex h-10 items-center gap-2 bg-blue-600 px-4 font-semibold text-white transition-colors hover:bg-blue-700 md:px-6"
                >
                  {t("viewDetails")}
                </Link>
              )}
              {current.type !== "movie" ? (
                <WatchlistButton
                  mediaType={current.type === "series" ? "SERIES" : "ANIME"}
                  mediaId={current.id}
                  slug={current.slug}
                  initialInWatchlist={current.inWatchlist}
                  isLoggedIn={isLoggedIn}
                />
              ) : (
                <WatchlistButton
                  mediaType="SERIES"
                  mediaId={current.id}
                  slug={current.slug}
                  initialInWatchlist={false}
                  isLoggedIn={false}
                />
              )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 pt-4 md:pt-6 lg:pt-8">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => goTo(index)}
                  className="h-2 overflow-hidden rounded-full bg-white/40 transition-all duration-500"
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
        className="absolute left-0 top-1/3 z-20 hidden h-10 w-10 -translate-y-1/3 items-center justify-center text-[#bbb] hover:text-white transition-all md:flex lg:left-2 md:h-12 md:w-12"
        aria-label={
          current.type === "series" ? "Série anterior" : "Anime anterior"
        }
      >
        <ChevronLeft size={40} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-0 top-1/3 z-20 hidden h-10 w-10 -translate-y-1/3 items-center justify-center text-[#bbb] hover:text-white transition-all md:flex lg:right-2 md:h-12 md:w-12"
        aria-label={
          current.type === "series" ? "Próxima série" : "Próximo anime"
        }
      >
        <ChevronRight size={40} />
      </button>
    </section>
  );
}

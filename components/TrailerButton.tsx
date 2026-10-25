"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Film, X } from "lucide-react";

interface TrailerButtonProps {
  url?: string | null;
  compact?: boolean;
  className?: string;
  hasBorder?: boolean;
  roundedFull?: boolean;
  showLabel?: boolean;
  size?: number;
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const match = parsed.pathname.match(
        /^\/(?:embed|shorts|v|live)\/([^/?]+)/,
      );
      if (match) {
        return match[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export default function TrailerButton({
  url,
  compact = false,
  hasBorder = true,
  roundedFull = true,
  showLabel = false,
  size,
  className = "",
}: TrailerButtonProps) {
  const t = useTranslations("Buttons");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!url) return null;

  const youtubeId = extractYouTubeId(url);
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : null;

  const iconSize = size ?? (compact ? 14 : 16);
  const sizeClass = compact ? "p-1.5" : "p-2";
  const borderClass = hasBorder ? "border border-zinc-800" : "";
  const roundedClass = roundedFull ? "rounded-full" : "rounded-md";

  const handleOpen = () => {
    if (embedUrl) {
      setIsOpen(true);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const tooltipElement = (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 rounded mb-2 px-2.5 py-2 text-xs font-normal text-white bg-[#272727] shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
      {t("trailer")}
    </span>
  );

  const trigger = showLabel ? (
    <button
      onClick={handleOpen}
      className={`group relative inline-flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-0 focus:outline-none cursor-pointer ${className}`}
      aria-label={t("trailer")}
    >
      <div
        className={`inline-flex items-center justify-center ${roundedClass} bg-zinc-900/90 ${borderClass} ${sizeClass} text-white shadow-lg backdrop-blur-md transition-all duration-300 group-hover:bg-zinc-800 group-hover:border-zinc-700 group-active:scale-95`}
      >
        <Film
          size={iconSize}
          className="text-white transition-transform duration-200 group-hover:scale-110"
        />
      </div>
      <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors sm:hidden whitespace-nowrap">
        {t("trailer")}
      </span>
      {tooltipElement}
    </button>
  ) : (
    <button
      onClick={handleOpen}
      className={`group relative inline-flex items-center justify-center ${roundedClass} bg-zinc-900/90 ${borderClass} ${sizeClass} text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-700 hover:shadow-white/5 active:scale-95 focus:outline-none ${className}`}
      aria-label={t("trailer")}
    >
      <Film
        size={iconSize}
        className="text-white transition-transform duration-200 group-hover:scale-110"
      />
      {tooltipElement}
    </button>
  );

  if (!embedUrl || !isOpen) {
    return trigger;
  }

  return (
    <>
      {trigger}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t("trailer")}
          >
            <div
              className="relative h-full w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-44 top-1 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-white transition hover:bg-zinc-800"
                aria-label={t("close")}
              >
                <X size={24} />
              </button>
              <div className="h-full w-full overflow-hidden bg-black">
                <iframe
                  src={`${embedUrl}?autoplay=1&rel=0`}
                  title={t("trailer")}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

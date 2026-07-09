"use client";

import { useTranslations } from "next-intl";
import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  url?: string;
  compact?: boolean;
  className?: string;
  hasBorder?: boolean;
  roundedFull?: boolean;
  mobileVertical?: boolean;
}

export default function ShareButton({
  url,
  compact = false,
  className = "",
  hasBorder,
  roundedFull = false,
  mobileVertical = false,
}: ShareButtonProps) {
  const t = useTranslations("Buttons");
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const shareUrl = url || window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar link: ", err);
    }
  };

  const getButtonClass = () => {
    if (compact) {
      return `flex items-center justify-center font-semibold transition-colors duration-300 flex-shrink-0 cursor-pointer h-8 w-8 relative group ${
        copied
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-[#f2f2f2] hover:text-white"
      }${roundedFull ? " rounded-full" : ""}`;
    }

    if (mobileVertical) {
      let base = `flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 font-semibold transition-colors duration-300 flex-shrink-0 cursor-pointer relative group text-xs md:text-sm h-auto py-1 md:h-10 md:w-fit md:px-2 md:py-1.5 ${
        copied
          ? "text-emerald-600 hover:text-emerald-700"
          : "text-blue-600 hover:text-blue-700"
      }`;

      if (roundedFull) {
        base += " rounded-full";
      }

      if (hasBorder === true) {
        if (copied) {
          base += " border-2 border-emerald-600";
        } else {
          base += " border-2 border-blue-600";
        }
      } else if (hasBorder === false) {
        base += " border-0";
      } else {
        base += " border-0 md:border-0";
      }

      return base;
    }

    let base =
      "flex h-10 flex-1 md:flex-initial md:w-fit items-center justify-center gap-2 font-semibold transition-colors duration-300 flex-shrink-0 cursor-pointer px-4 py-1.5 md:px-2 md:py-1.5 relative group";

    if (roundedFull) {
      base += " rounded-full";
    }

    if (hasBorder === undefined) {
      if (copied) {
        base +=
          " border-2 border-emerald-600 text-emerald-600 hover:text-emerald-700 md:border-0";
      } else {
        base +=
          " border-2 border-blue-600 text-blue-600 hover:text-blue-700 md:border-0";
      }
    } else if (hasBorder === true) {
      if (copied) {
        base +=
          " border-2 border-emerald-600 text-emerald-600 hover:text-emerald-700";
      } else {
        base += " border-2 border-blue-600 text-blue-600 hover:text-blue-700";
      }
    } else {
      base += " border-0";
      if (copied) {
        base += " text-emerald-600 hover:text-emerald-700";
      } else {
        base += " text-blue-600 hover:text-blue-700";
      }
    }

    return base;
  };

  const tooltipElement = (
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 text-xs font-semibold text-white bg-[#272727] shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
      {copied ? t("linkCopied") : t("share")}
    </span>
  );

  return (
    <button
      onClick={handleShare}
      className={`${getButtonClass()} ${className}`}
      aria-label={copied ? t("linkCopied") : t("share")}
    >
      {copied ? (
        <Check className={compact ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <Share2 className={compact ? "h-6 w-6" : "h-6 w-6"} />
      )}
      {!compact && (
        <span
          className={
            mobileVertical ? "text-xs md:hidden font-medium" : "md:hidden"
          }
        >
          {copied ? t("copied") : t("share")}
        </span>
      )}
      {tooltipElement}
    </button>
  );
}

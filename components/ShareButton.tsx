"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  url?: string;
  compact?: boolean;
  className?: string;
  hasBorder?: boolean;
  roundedFull?: boolean;
}

export default function ShareButton({
  url,
  compact = false,
  className = "",
  hasBorder,
  roundedFull = false,
}: ShareButtonProps) {
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
          : "text-blue-600 hover:text-blue-700"
      }${roundedFull ? " rounded-full" : ""}`;
    }

    let base =
      "flex h-10 flex-1 md:flex-initial md:w-fit items-center justify-center gap-2 font-semibold transition-colors duration-300 flex-shrink-0 cursor-pointer px-4 py-1.5 md:px-2 md:py-1.5 relative group";

    if (roundedFull) {
      base += " rounded-full";
    }

    if (hasBorder === undefined) {
      if (copied) {
        base += " border-2 border-emerald-600 text-emerald-600 hover:text-emerald-700 md:border-0";
      } else {
        base += " border-2 border-blue-600 text-blue-600 hover:text-blue-700 md:border-0";
      }
    } else if (hasBorder === true) {
      if (copied) {
        base += " border-2 border-emerald-600 text-emerald-600 hover:text-emerald-700";
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
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-semibold text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
      {copied ? "Link copiado!" : "Compartilhar"}
    </span>
  );

  return (
    <button
      onClick={handleShare}
      className={`${getButtonClass()} ${className}`}
      aria-label={copied ? "Link copiado" : "Compartilhar"}
    >
      {copied ? (
        <Check className={compact ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <Share2 className={compact ? "h-6 w-6" : "h-6 w-6"} />
      )}
      {!compact && (
        <span className="md:hidden">
          {copied ? "Copiado!" : "Compartilhar"}
        </span>
      )}
      {tooltipElement}
    </button>
  );
}

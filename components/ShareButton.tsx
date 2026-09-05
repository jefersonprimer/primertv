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
  size?: number;
}

export default function ShareButton({
  url,
  compact = false,
  hasBorder = true,
  roundedFull = true,
  size,
  className = "",
}: ShareButtonProps) {
  const t = useTranslations("Buttons");
  const [copied, setCopied] = useState(false);

  const iconSize = size ?? (compact ? 14 : 16);
  const sizeClass = compact ? "p-1.5" : "p-2";

  const borderClass = hasBorder ? "border border-zinc-800" : "";
  const roundedClass = roundedFull ? "rounded-full" : "rounded-md";

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

  return (
    <button
      onClick={handleShare}
      className={`group relative inline-flex items-center justify-center ${roundedClass} bg-zinc-900/90 ${borderClass} ${sizeClass} text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-zinc-800 hover:border-zinc-700 hover:shadow-white/5 active:scale-95 focus:outline-none ${className}`}
      aria-label={copied ? t("linkCopied") : t("share")}
    >
      {copied ? (
        <Check
          size={iconSize}
          className="text-white transition-transform duration-200 scale-110"
        />
      ) : (
        <Share2
          size={iconSize}
          className="text-white transition-transform duration-200 group-hover:scale-110"
        />
      )}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 text-xs font-normal text-white bg-[#272727] shadow-xl opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap z-50">
        {copied ? t("linkCopied") : t("share")}
      </span>
    </button>
  );
}

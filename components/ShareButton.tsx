"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonProps {
  url?: string;
  compact?: boolean;
  className?: string;
}

export default function ShareButton({
  url,
  compact = false,
  className = "",
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

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center font-semibold transition-colors duration-300 flex-shrink-0 cursor-pointer ${
        compact
          ? `h-8 w-8 rounded-lg ${
              copied
                ? "text-emerald-600 hover:text-emerald-700"
                : "text-blue-600 hover:text-blue-700"
            }`
          : `h-10 flex-1 md:flex-initial md:w-fit items-center justify-center gap-2 border-2 px-4 py-1.5 md:px-2 md:py-1.5 rounded-lg md:rounded-none md:border-0 ${
              copied
                ? "border-emerald-600 text-emerald-600 hover:text-emerald-700"
                : "border-blue-600 text-blue-600 hover:text-blue-700"
            }`
      } ${className}`}
      title={copied ? "Link copiado!" : "Compartilhar página"}
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
    </button>
  );
}

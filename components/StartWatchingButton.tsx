"use client";

import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { Link } from "@/i18n/routing";

interface StartWatchingButtonProps {
  href: string;
  className?: string;
  uppercase?: boolean;
  text?: string;
}

export function StartWatchingButton({
  href,
  className = "",
  uppercase = true,
  text,
}: StartWatchingButtonProps) {
  const t = useTranslations("Buttons");

  let displayText = text;
  if (!text) {
    displayText = t("startWatching");
  } else if (text === "Assistir") {
    displayText = t("watch");
  }

  return (
    <Link
      href={href}
      className={`flex h-10 items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 font-bold text-white transition-colors ${
        uppercase ? "uppercase" : ""
      } ${className}`}
    >
      <Play className="h-5 w-5 fill-current" />
      {displayText}
    </Link>
  );
}

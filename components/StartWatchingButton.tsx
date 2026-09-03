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

  const baseClass = `group relative inline-flex h-[42px] items-center justify-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-4 shadow-lg backdrop-blur-md transition-all duration-200 focus:outline-none text-white text-sm font-medium ${
    uppercase ? "uppercase" : ""
  } ${className}`;

  return (
    <Link
      href={href}
      className={baseClass}
    >
      <Play className="h-4 w-4 fill-current text-white group-hover:text-white transition-transform duration-200 group-hover:scale-110" />
      <span>{displayText}</span>
    </Link>
  );
}

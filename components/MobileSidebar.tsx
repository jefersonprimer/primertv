"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  Tv,
  Film,
  Sparkles,
  BookOpen,
  Radio,
  Layers,
  Calendar,
  Heart,
  TrendingUp,
  Clock,
} from "lucide-react";
import { NAV_LINKS } from "./nav-links";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "./LanguageSwitcher";

const linkKeyMap: Record<string, string> = {
  "/series": "series",
  "/movies": "movies",
  "/animes": "animes",
  "/mangas": "mangas",
  "/livetv": "livetv",
  "/seasons": "seasons",
  "/calendar": "calendar",
  "/novelas": "novelas",
  "/popular": "popular",
  "/new": "new",
};

const linkIconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  "/series": Tv,
  "/movies": Film,
  "/animes": Sparkles,
  "/mangas": BookOpen,
  "/livetv": Radio,
  "/seasons": Layers,
  "/calendar": Calendar,
  "/novelas": Heart,
  "/popular": TrendingUp,
  "/new": Clock,
};

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Header");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const panel = isOpen ? (
    <>
      <div
        className="fixed inset-x-0 top-14 2xl:top-16 bottom-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className="fixed top-14 2xl:top-16 bottom-0 left-0 z-[70] w-66 bg-[#0E0E0E] border-r border-zinc-800/80 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <nav className="flex flex-col gap-1 py-3 px-2">
          {NAV_LINKS.map((link) => {
            const Icon = linkIconMap[link.href];
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium text-[#bbb] transition-colors hover:bg-[#1f1f1f] hover:text-white"
              >
                {Icon && (
                  <Icon
                    size={18}
                    className="shrink-0 text-[#999] group-hover:text-white transition-colors"
                  />
                )}
                <span>{t(linkKeyMap[link.href] || link.label)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800/80 p-4 flex flex-col gap-3.5 bg-[#0E0E0E]">
          <LanguageSwitcher />
          <div className="text-xs text-zinc-500 font-medium leading-relaxed">
            © {new Date().getFullYear()} primer tv. Todos os direitos reservados.
          </div>
        </div>
      </aside>
    </>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors ${
          isOpen ? "text-white bg-[#151515]" : ""
        }`}
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-5 h-5 2xl:w-6 2xl:h-6" />
        ) : (
          <Menu className="w-5 h-5 2xl:w-6 2xl:h-6" />
        )}
      </button>

      {typeof document !== "undefined" && panel
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}

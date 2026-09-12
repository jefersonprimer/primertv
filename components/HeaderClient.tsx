"use client";

import { useState } from "react";
import {
  User,
  Bookmark,
  Search,
  ChevronDown,
  BookOpen,
  Heart,
  Layers,
  Calendar,
  Flame,
  Clock,
} from "lucide-react";
import dynamic from "next/dynamic";
import { MobileSidebar } from "./MobileSidebar";
import { Link, usePathname } from "@/i18n/routing";
import { UserMenu } from "./UserMenu";
import { SessionUser } from "@/lib/auth";
import { MAIN_NAV_LINKS, EXPLORE_NAV_LINKS } from "./nav-links";
import { useTranslations } from "next-intl";

const AddMediaButton = dynamic(
  () => import("./admin/AddMediaButton").then((mod) => mod.AddMediaButton),
  { ssr: false }
);

interface HeaderClientProps {
  user?: SessionUser | null;
}

const exploreIconMap: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  "/mangas": BookOpen,
  "/novelas": Heart,
  "/seasons": Layers,
  "/calendar": Calendar,
  "/popular": Flame,
  "/new": Clock,
};

export function HeaderClient({ user }: HeaderClientProps) {
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const t = useTranslations("Header");
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isExploreActive = EXPLORE_NAV_LINKS.some((link) => isActive(link.href));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 bg-[#0E0E0E]">
      <div className="mx-auto flex h-14 2xl:h-16 max-w-full items-center justify-between">
        <div className="flex h-full items-center gap-4">
          <div className="flex h-full items-center gap-3">
            <MobileSidebar className="lg:hidden" />
            <Link
              href="/"
              className="flex items-center text-xl tracking-tight hover:scale-[1.03] transition-transform duration-300 group"
            >
              <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
                primer
              </span>
              <span className="font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent ml-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                tv
              </span>
            </Link>
          </div>

          <nav className="hidden h-full items-center sm:flex">
            {MAIN_NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              const isLiveTv = link.href === "/livetv";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`items-center px-3.5 py-2 rounded-md text-sm transition-colors ${
                    isLiveTv ? "hidden md:flex" : "flex"
                  } ${
                    active
                      ? "text-white font-semibold bg-white/10"
                      : "text-[#bbb] hover:text-white hover:bg-white/10 font-medium"
                  }`}
                >
                  {t(link.key)}
                </Link>
              );
            })}

            {/* Dropdown Explorar */}
            <div className="relative hidden lg:flex items-center h-full">
              <button
                type="button"
                onClick={() => setIsExploreOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  isExploreActive || isExploreOpen
                    ? "text-white font-semibold bg-white/10"
                    : "text-[#bbb] hover:text-white hover:bg-white/10 font-medium"
                }`}
                aria-expanded={isExploreOpen}
              >
                <span>{t("explore")}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExploreOpen ? "rotate-180 text-white" : "text-[#bbb]"
                  }`}
                />
              </button>

              {isExploreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExploreOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-[#151515] p-2 shadow-2xl border border-zinc-800/80 rounded-2xl flex flex-col gap-1 backdrop-blur-md">
                    {EXPLORE_NAV_LINKS.map((link) => {
                      const Icon = exploreIconMap[link.href];
                      const active = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsExploreOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                            active
                              ? "bg-zinc-800 text-white font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
                          }`}
                        >
                          {Icon && (
                            <Icon
                              size={18}
                              className={`shrink-0 ${
                                active ? "text-white" : "text-zinc-400"
                              }`}
                            />
                          )}
                          <span>{t(link.key)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="flex h-full items-center gap-1.5">
          <Link
            href="/search"
            className="flex p-2 2xl:p-2.5 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-white/10 transition-colors"
          >
            <Search className="w-6 h-6" />
          </Link>

          {user ? (
            <div className="flex h-full items-center gap-2">
              <Link
                href="/watchlist"
                className="hidden md:flex p-2 2xl:p-2.5 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-white/10 transition-colors"
                title="Sua Lista"
              >
                <Bookmark className="w-6 h-6" />
              </Link>
              {user.role === "admin" && <AddMediaButton />}
              <UserMenu user={user} />
            </div>
          ) : (
            <Link
              href="/login"
              className="flex p-2 2xl:p-2.5 items-center justify-center rounded-full text-[#bbb] hover:text-white hover:bg-white/10 transition-colors"
            >
              <User className="w-6 h-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

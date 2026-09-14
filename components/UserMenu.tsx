"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import {
  LogOut,
  History,
  Bookmark,
  List,
  Globe,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  User as UserIcon,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { SessionUser } from "@/lib/auth";
import { Link, useRouter, usePathname } from "@/i18n/routing";

interface UserMenuProps {
  user: SessionUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"main" | "language">("main");
  const t = useTranslations("UserMenu");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const languages = [
    { code: "pt-br", label: "Português (Brasil)" },
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "ar", label: "العربية" },
  ];

  const currentLanguage =
    languages.find((l) => l.code === locale)?.label || "English";

  const handleClose = () => {
    setIsOpen(false);
    setView("main");
  };

  const handleLanguageChange = (code: string) => {
    router.replace(pathname, { locale: code });
    handleClose();
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => {
          if (isOpen) {
            handleClose();
          } else {
            setIsOpen(true);
            setView("main");
          }
        }}
        className="flex items-center gap-1.5 p-1 pr-2 rounded-full hover:bg-white/10 transition-colors group cursor-pointer"
        title={user.name}
        aria-expanded={isOpen}
      >
        <div className="relative flex h-9 w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-base 2xl:text-lg font-normal text-white shadow-sm ring-2 ring-zinc-800/50 group-hover:ring-zinc-600 transition-all overflow-hidden">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              fill
              sizes="(max-width: 1536px) 36px, 40px"
              className="object-cover"
              priority
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen
              ? "rotate-180 text-white"
              : "text-[#bbb] group-hover:text-white"
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute right-0 top-full mt-2 lg:mt-3 2xl:mt-4 z-50 w-72 bg-[#151515] p-2 shadow-2xl border border-zinc-800/80 rounded-2xl">
            {view === "main" ? (
              <>
                <div className="px-3 py-2.5 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/10 overflow-hidden">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-white">
                          {user.name}
                        </p>
                      </div>
                      <p className="truncate text-xs text-[#bbb]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-700/60">
                  <div className="py-2">
                    <Link
                      href="/profile"
                      onClick={handleClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                    >
                      <UserIcon size={20} />
                      <span>{t("profile")}</span>
                    </Link>

                    {user.role !== "admin" && (
                      <>
                        <Link
                          href="/history"
                          onClick={handleClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                        >
                          <History size={20} />
                          <span>{t("history")}</span>
                        </Link>
                        <Link
                          href="/watchlist"
                          onClick={handleClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                        >
                          <Bookmark size={20} />
                          <span>{t("watchlist")}</span>
                        </Link>
                        <Link
                          href="/lists"
                          onClick={handleClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                        >
                          <List size={20} />
                          <span>{t("myLists")}</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Idioma de exibição */}
                  <div className="py-1 border-t border-zinc-700/60">
                    <button
                      onClick={() => setView("language")}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200 cursor-pointer group rounded-md"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <Globe size={20} className="shrink-0" />
                        <span className="truncate">
                          {t("displayLanguage")}:{" "}
                          <span className="text-white font-normal">
                            {currentLanguage}
                          </span>
                        </span>
                      </div>
                      <ChevronRight
                        size={20}
                        className="shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors"
                      />
                    </button>
                  </div>

                  <div className="border-t border-zinc-700/60 my-1" />

                  <button
                    onClick={async () => {
                      await logout();
                      handleClose();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-red-500 transition-all duration-200 cursor-pointer rounded-md"
                  >
                    <LogOut size={20} />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              </>
            ) : (
              /* Language Selection View */
              <div className="py-1">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700/60">
                  <button
                    onClick={() => setView("main")}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    title="Voltar"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-semibold text-white">
                    {t("displayLanguage")}
                  </span>
                </div>

                <div className="py-2">
                  {languages.map((lang) => {
                    const isSelected = lang.code === locale;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-between rounded-md w-full px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "text-white bg-zinc-800/60"
                            : "text-zinc-400 hover:text-white hover:bg-zinc-700/40"
                        }`}
                      >
                        <span>{lang.label}</span>
                        {isSelected && (
                          <Check
                            size={18}
                            className="text-white stroke-[2.5]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

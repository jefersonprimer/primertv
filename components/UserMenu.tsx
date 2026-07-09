"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LogOut, History, Bookmark, List } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { SessionUser } from "@/lib/auth";
import { Link } from "@/i18n/routing";

interface UserMenuProps {
  user: SessionUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("UserMenu");

  return (
    <div className="relative flex h-full items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-full items-center px-4 text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors ${
          isOpen ? "bg-[#151515]" : ""
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm ring-2 transition-all hover:scale-105 active:scale-95 ring-zinc-800/50">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 w-64 bg-[#151515] p-1.5 shadow-2xl">
            <div className="px-3 py-2.5 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/10">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.name}
                    </p>
                  </div>
                  <p className="truncate text-xs text-[#bbb]">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-700/60">
              {user.role !== "admin" && (
                <div className="py-2">
                  <Link
                    href="/history"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                  >
                    <History size={18} />
                    <span>{t("history")}</span>
                  </Link>
                  <Link
                    href="/watchlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                  >
                    <Bookmark size={18} />
                    <span>{t("watchlist")}</span>
                  </Link>
                  <Link
                    href="/lists"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-50 transition-all duration-200"
                  >
                    <List size={18} />
                    <span>{t("myLists")}</span>
                  </Link>
                </div>
              )}

              <div className="border-t border-zinc-700/60 mb-2" />

              <button
                onClick={async () => {
                  await logout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700/50 hover:text-red-500 transition-all duration-200"
              >
                <LogOut size={18} />
                <span>{t("logout")}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

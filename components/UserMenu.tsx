"use client";
import { useState } from "react";
import {
  User,
  LogOut,
  LayoutDashboard,
  History,
  Bookmark,
  List,
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { SessionUser } from "@/lib/auth";

interface UserMenuProps {
  user: SessionUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex h-full items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-full items-center px-4 text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors ${
          isOpen ? "bg-[#151515]" : ""
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm ring-2 ring-zinc-200/50 transition-all hover:scale-105 active:scale-95 dark:ring-zinc-800/50">
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
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                      {user.name}
                    </p>
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                      {user.role === "admin" ? "Admin" : "Membro"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="my-1.5 border-t border-zinc-200 dark:border-zinc-700/60" />

            <div className="space-y-0.5">
              {user.role !== "admin" && (
                <>
                  <Link
                    href="/historico"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50 transition-all duration-200"
                  >
                    <History size={18} />
                    <span>Histórico</span>
                  </Link>
                  <Link
                    href="/watchlist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50 transition-all duration-200"
                  >
                    <Bookmark size={18} />
                    <span>Watchlist</span>
                  </Link>
                  <Link
                    href="/listas"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50 transition-all duration-200"
                  >
                    <List size={18} />
                    <span>Minhas Listas</span>
                  </Link>
                </>
              )}

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50 transition-all duration-200"
                >
                  <LayoutDashboard size={18} />
                  <span>Painel Admin</span>
                </Link>
              )}

              <div className="my-1.5 border-t border-zinc-200 dark:border-zinc-700/60" />

              <button
                onClick={async () => {
                  await logout();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 transition-all duration-200"
              >
                <LogOut size={18} />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

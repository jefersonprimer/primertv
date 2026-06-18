"use client";

import { useState } from "react";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

interface UserMenuProps {
  user: {
    name: string;
    role: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative flex h-full items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-full items-center px-4 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
          isOpen ? "bg-zinc-100 dark:bg-zinc-800" : ""
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          <User size={20} />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 w-64 overflow-hidden border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user.role === "admin" ? "Administrador" : "Membro"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                >
                  <LayoutDashboard size={18} className="text-blue-500" />
                  Painel Admin
                </Link>
              )}

              <button
                onClick={async () => {
                  await logout();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut size={18} />
                Sair da conta
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

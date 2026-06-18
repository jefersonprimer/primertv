"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu } from "lucide-react";
import { NAV_LINKS } from "./nav-links";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const panel = isOpen ? (
    <>
      <div
        className="fixed inset-x-0 top-16 bottom-0 z-[60] bg-black/50 md:hidden"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <aside className="fixed top-16 bottom-0 left-0 z-[70] w-full border-r border-zinc-200 bg-white sm:w-64 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <nav className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-blue-500 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-blue-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-full items-center px-4 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden ${
          isOpen ? "bg-zinc-100 dark:bg-zinc-800" : ""
        }`}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
      >
        <Menu size={22} />
      </button>

      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}

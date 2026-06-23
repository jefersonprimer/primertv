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

      <aside className="fixed top-16 bottom-0 left-0 z-[70] w-full bg-[#151515] sm:w-70 md:hidden">
        <nav className="flex flex-col gap-1 py-2.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-base font-medium text-[#bbb] transition-colors hover:bg-[#272727] hover:text-[#f2f2f2]"
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
        className={`flex h-full items-center px-4 text-[#bbb] hover:text-[#f2f2f2] transition-colors hover:bg-[#151515] md:hidden ${
          isOpen ? "text-[#f2f2f2] bg-[#151515]" : ""
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

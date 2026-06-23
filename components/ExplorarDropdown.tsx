"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export function ExplorarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/filmes", label: "Filmes" },
    { href: "/novelas", label: "Novelas" },
    { href: "/livetv", label: "Canais" },
    { href: "/calendario", label: "Calendário" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex h-full items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`flex h-full items-center gap-1.5 px-4 text-sm font-medium text-[#bbb] hover:text-[#f2f2f2] transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-950 focus:outline-none ${
          isOpen ? "bg-zinc-100 text-[#f2f2f2] dark:bg-zinc-950" : ""
        }`}
      >
        Explorar
        <ChevronDown size={20} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 w-52 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 py-1.5 shadow-2xl backdrop-blur-md animate-[fadeIn_0.15s_ease-out]">
          <div className="flex flex-col gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

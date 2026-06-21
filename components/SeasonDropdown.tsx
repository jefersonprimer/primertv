"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface SeasonOption {
  slug: string;
  label: string;
}

interface SeasonDropdownProps {
  seasons: SeasonOption[];
  currentSlug: string;
}

export function SeasonDropdown({ seasons, currentSlug }: SeasonDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Retrieve current active season or construct fallback
  const selectedSeason = seasons.find((s) => s.slug === currentSlug) || {
    slug: currentSlug,
    label: currentSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    router.push(`/seasons/${slug}`);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex w-full items-center justify-between gap-x-2 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none  dark:text-zinc-300 dark:hover:bg-zinc-800 uppercase ${isOpen ? "bg-white dark:bg-zinc-900" : ""}`}
          id="menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span>{selectedSeason.label}</span>
          <ChevronDown
            className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-50 w-54 py-2 origin-top-right bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-zinc-900"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div
            className="py-1 max-h-84 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800"
            role="none"
          >
            {seasons.map((season) => (
              <button
                key={season.slug}
                onClick={() => handleSelect(season.slug)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                  season.slug === currentSlug
                    ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/30 dark:text-blue-400"
                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
                role="menuitem"
              >
                {season.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

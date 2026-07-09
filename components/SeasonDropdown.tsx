"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
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
  const t = useTranslations("SeasonsPage");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getLocalizedSeasonLabel = (slug: string) => {
    const parts = slug.split("-");
    if (parts.length < 2) return slug;
    const season = parts[0].toLowerCase();
    const year = parts[1];
    return t("seasonLabelFormat", {
      season: t(`seasons.${season}`),
      year,
    });
  };

  const selectedSeasonLabel = getLocalizedSeasonLabel(currentSlug);

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
    <div className="relative inline-block" ref={containerRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex w-full items-center justify-between gap-x-2 px-4 py-2 text-sm font-semibold text-[#bbb] transition-colors focus:outline-none hover:text-white hover:bg-[#272727] uppercase ${isOpen ? "text-white bg-[#272727]" : ""}`}
          id="menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span>{selectedSeasonLabel}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-50 w-54 py-2 origin-top-right bg-[#272727] shadow-lg ring-1 ring-black/5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div
            className="max-h-84 overflow-y-auto scrollbar-thin scrollbar-thumb-[#151515]"
            role="none"
          >
            {seasons.map((season) => (
              <button
                key={season.slug}
                onClick={() => handleSelect(season.slug)}
                className={`flex w-full items-center px-4 py-2 text-sm transition-colors ${
                  season.slug === currentSlug
                    ? "text-white font-semibold bg-[#151515]"
                    : "text-[#bbb] hover:bg-[#151515] hover:text-white"
                }`}
                role="menuitem"
              >
                {getLocalizedSeasonLabel(season.slug)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

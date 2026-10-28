"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export interface SeasonDropdownOption {
  value: string | number;
  label: string;
  detail?: string;
}

interface SharedSeasonDropdownProps {
  options: SeasonDropdownOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
}

interface RouteSeasonDropdownProps {
  seasons: { slug: string; label: string }[];
  currentSlug: string;
}

function SharedSeasonDropdown({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  triggerClassName = "",
}: SharedSeasonDropdownProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [menuMaxWidth, setMenuMaxWidth] = useState<number | undefined>();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    // Keep the menu inside the viewport and any horizontally clipped parent.
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (triggerRect) {
      let leftBound = 8;
      let rightBound = window.innerWidth - 8;
      let parent = rootRef.current?.parentElement;
      while (parent) {
        const overflowX = window.getComputedStyle(parent).overflowX;
        if (["auto", "scroll", "hidden", "clip"].includes(overflowX)) {
          const rect = parent.getBoundingClientRect();
          leftBound = Math.max(leftBound, rect.left);
          rightBound = Math.min(rightBound, rect.right);
        }
        parent = parent.parentElement;
      }

      const rightSpace = Math.max(0, rightBound - triggerRect.left);
      const leftSpace = Math.max(0, triggerRect.right - leftBound);
      const preferredWidth = Math.min(480, window.innerWidth * 0.9);
      const shouldAlignRight =
        rightSpace < preferredWidth && leftSpace > rightSpace;
      setAlignRight(shouldAlignRight);
      setMenuMaxWidth(
        Math.max(
          0,
          Math.min(preferredWidth, shouldAlignRight ? leftSpace : rightSpace),
        ),
      );
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!selected) return null;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex max-w-full min-w-0 items-center gap-2 text-left text-lg font-bold text-[#f2f2f2] transition-colors hover:text-white ${triggerClassName}`}
      >
        <span className="line-clamp-1 min-w-0">{selected.label}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar seletor de temporadas"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            aria-label={ariaLabel}
            style={{ maxWidth: menuMaxWidth }}
            className={`absolute ${alignRight ? "right-0 left-auto" : "left-0 right-auto"} top-full z-50 mt-2 max-h-90 w-max min-w-full max-w-[min(90vw,36rem)] overflow-x-hidden overflow-y-auto rounded-xl bg-[#272727] py-2 custom-scrollbar`}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-8 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-[#151515] ${
                    isSelected ? "bg-[#151515] text-white" : "text-[#bbb]"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {option.detail && (
                    <span className="shrink-0 text-xs font-normal text-[#bbb]">
                      {option.detail}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function SeasonDropdown({
  seasons,
  currentSlug,
}: RouteSeasonDropdownProps) {
  const router = useRouter();
  const t = useTranslations("SeasonsPage");
  const options = seasons.map((season) => {
    const [seasonName, year] = season.slug.split("-");
    return {
      value: season.slug,
      label:
        year && seasonName
          ? t("seasonLabelFormat", {
              season: t(`seasons.${seasonName.toLowerCase()}`),
              year,
            })
          : season.label,
    };
  });

  return (
    <SharedSeasonDropdown
      options={options}
      value={currentSlug}
      ariaLabel={t("seasonLabel")}
      onChange={(value) => router.push(`/seasons/${value}`)}
      triggerClassName="rounded px-4 py-2 text-sm uppercase"
    />
  );
}

export default SharedSeasonDropdown;

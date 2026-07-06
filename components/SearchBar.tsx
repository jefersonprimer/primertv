"use client";

import { useRouter } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

const MAX_RECENT = 12;
const STORAGE_KEY = "recent-searches";

interface SearchBarProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  showRecent?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  showRecent = true,
}: SearchBarProps = {}) {
  const t = useTranslations("Search");
  const [localQuery, setLocalQuery] = useState("");
  const isControlled = value !== undefined && onChange !== undefined;
  const query = isControlled ? value : localQuery;

  const setQuery = (val: string) => {
    if (isControlled) {
      onChange?.(val);
    } else {
      setLocalQuery(val);
    }
  };

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isControlled) {
      inputRef.current?.focus();
    }
  }, [isControlled]);

  const saveSearches = (searches: string[]) => {
    setRecentSearches(searches);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isControlled) return;
    const trimmed = query.trim();
    if (trimmed) {
      const upper = trimmed.toUpperCase();
      const updated = [
        upper,
        ...recentSearches.filter((s) => s !== upper),
      ].slice(0, MAX_RECENT);
      saveSearches(updated);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
    if (!isControlled) {
      router.push("/search");
    }
  };

  const handleRemoveSearch = (search: string) => {
    saveSearches(recentSearches.filter((s) => s !== search));
  };

  const handleClearAll = () => {
    saveSearches([]);
  };

  const handleRecentClick = (search: string) => {
    const original = search.toLowerCase();
    setQuery(original);
    router.push(`/search?q=${encodeURIComponent(original)}`);
  };

  return (
    <div className="w-full bg-[#151515]">
      <div className="w-full">
        <div className="flex justify-center w-full py-6 px-4 xl:px-0">
          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-[880px]"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || t("placeholder")}
              className="w-full border-b-2 border-zinc-200 bg-transparent py-2 pl-1 text-xl lg:text-3xl text-white outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:focus:border-blue-500"
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
                aria-label={t("clearSearch")}
              >
                <X size={24} />
              </button>
            )}
          </form>
        </div>

        {showRecent &&
          !isControlled &&
          recentSearches.length > 0 &&
          query.length === 0 && (
            <div className="w-full bg-black pt-4 sm:pt-6 pb-18 sm:pb-24 py-6 px-4 xl:px-0">
              <div className="mx-auto mt-6 max-w-[1050px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base sm:text-xl font-bold tracking-widest text-[#f2f2f2]">
                    {t("recentSearches")}
                  </h3>
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 text-sm text-[#bbb] font-bold ransition-colors hover:text-[#f2f2f2] uppercase"
                  >
                    {t("clear")}
                    <span className="hidden sm:flex">{t("searches")}</span>
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <div
                      key={search}
                      className="group flex sm:inline-flex justify-between sm:justify-start cursor-pointer items-center transition-colors bg-[#344A54] hover:bg-[#344A54]/80 w-full md:w-fit xl:max-w-[300px] min-w-0"
                      onClick={() => handleRecentClick(search)}
                    >
                      <span className="text-xs font-medium uppercase text-[#bbb] hover:text-[#f2f2f2] px-2 py-0 truncate min-w-0">
                        {search}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSearch(search);
                        }}
                        className="border-l border-[#272727] text-[#bbb] transition-all hover:text-[#f2f2f2] p-0 shrink-0"
                        aria-label={t("removeSearch", { query: search })}
                      >
                        <X size={24} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

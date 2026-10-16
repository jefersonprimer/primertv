"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

const MAX_RECENT = 12;
const STORAGE_KEY = "recent-searches";

interface SearchBarProps {
  value?: string;
  defaultValue?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  showRecent?: boolean;
}

export function SearchBar({
  value,
  defaultValue = "",
  onChange,
  placeholder,
  showRecent = true,
}: SearchBarProps = {}) {
  const t = useTranslations("Search");
  const [localQuery, setLocalQuery] = useState(defaultValue);
  const isControlled = value !== undefined && onChange !== undefined;
  const query = isControlled ? value : localQuery;

  const setQuery = (val: string) => {
    if (isControlled) {
      onChange?.(val);
    } else {
      setLocalQuery(val);
    }
  };

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setLocalQuery(defaultValue);
    }
  }, [defaultValue, isControlled]);

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
    if (!isControlled && !defaultValue) {
      inputRef.current?.focus();
    }
  }, [isControlled, defaultValue]);

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
      inputRef.current?.blur();
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
    inputRef.current?.blur();
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
              type="search"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder || t("placeholder")}
              className="w-full border-b-2 bg-transparent py-2 pl-1 pr-20 text-xl lg:text-3xl text-white outline-none transition-all border-zinc-800 focus:border-blue-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />

            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                  aria-label={t("clearSearch")}
                >
                  <X size={22} />
                </button>
              )}
              <button
                type="submit"
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                aria-label={placeholder || t("placeholder")}
              >
                <Search size={22} />
              </button>
            </div>
          </form>
        </div>

        {showRecent &&
          !isControlled &&
          recentSearches.length > 0 &&
          query.length === 0 && (
            <div className="w-full bg-black py-6 px-4 xl:px-0">
              <div className="mx-auto max-w-[1050px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base sm:text-xl font-bold tracking-widest text-[#f2f2f2]">
                    {t("recentSearches")}
                  </h3>
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 text-sm text-[#bbb] font-bold transition-colors hover:text-[#f2f2f2] uppercase"
                  >
                    {t("clear")}
                    <span className="hidden sm:flex">{t("searches")}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search) => (
                    <div
                      key={search}
                      className="group inline-flex justify-between items-center transition-colors bg-[#344A54] hover:bg-[#344A54]/80 rounded-md overflow-hidden max-w-[300px] min-w-0 cursor-pointer"
                      onClick={() => handleRecentClick(search)}
                    >
                      <span className="text-xs font-medium uppercase text-[#bbb] group-hover:text-[#f2f2f2] px-3 py-1.5 truncate min-w-0">
                        {search}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSearch(search);
                        }}
                        className="border-l border-[#272727] text-[#bbb] hover:text-[#f2f2f2] p-1 shrink-0"
                        aria-label={t("removeSearch", { query: search })}
                      >
                        <X size={16} />
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

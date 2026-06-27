"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

const MAX_RECENT = 12;
const STORAGE_KEY = "recent-searches";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const saveSearches = (searches: string[]) => {
    setRecentSearches(searches);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
    router.push("/search");
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
        <div className="flex justify-center w-full py-6 px-4 md:px-0">
          <form
            onSubmit={handleSearch}
            className="relative w-full max-w-[880px]"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar animes, séries, filmes, mangás ou novelas..."
              className="w-full border-b-2 border-zinc-200 bg-transparent py-4 pl-12 pr-12 text-xl lg:text-3xl text-zinc-900 outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
            />
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400"
              size={24}
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label="Limpar pesquisa"
              >
                <X size={24} />
              </button>
            )}
          </form>
        </div>

        {recentSearches.length > 0 && query.length === 0 && (
          <div className="w-full bg-black pt-4 sm:pt-6 pb-18 sm:pb-24 py-6 px-4 md:px-0">
            <div className="mx-auto mt-6 max-w-[1050px]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-bold tracking-widest text-[#f2f2f2]">
                  Resultados Recentes de Busca
                </h3>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-[#bbb] font-bold transition-colors hover:text-[#f2f2f2] uppercase"
                >
                  Limpar
                  <span className="hidden sm:flex">Buscas</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <div
                    key={search}
                    className="group flex sm:inline-flex justify-between sm:justify-start cursor-pointer items-center transition-colors bg-[#344A54] hover:bg-[#344A54]/80"
                    onClick={() => handleRecentClick(search)}
                  >
                    <span className="text-xs font-medium uppercase text-[#bbb] hover:text-[#f2f2f2] px-2 py-0">
                      {search}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSearch(search);
                      }}
                      className="border-l border-[#272727] text-[#bbb] transition-all hover:text-[#f2f2f2] p-0"
                      aria-label={`Remover ${search}`}
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

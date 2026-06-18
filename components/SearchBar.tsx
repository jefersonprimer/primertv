"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="w-full bg-[#151515] py-6 px-8">
      <div className="mx-auto max-w-[1130px]">
        <div className="flex justify-center w-full">
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
              className="w-full border-b border-zinc-200 bg-transparent py-4 pl-12 pr-12 text-xl text-zinc-900 outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
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
      </div>
    </div>
  );
}

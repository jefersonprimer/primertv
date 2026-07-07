"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Globe, ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locales = [
    { code: "pt-br", label: "Português (Brasil)" },
    { code: "en", label: "English" },
  ];

  const currentLocale = locales.find((l) => l.code === locale) || locales[0];

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

  const handleSelect = (code: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: code });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 border border-zinc-800 px-3.5 py-2 rounded text-sm font-medium text-[#bbb] transition-all duration-200 hover:border-zinc-700 hover:bg-[#272727] hover:text-white focus:outline-none cursor-pointer
          ${isOpen ? "text-white bg-[#272727]" : ""}
            `}
      >
        <Globe size={18} />
        <span>{currentLocale.label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full z-50 mb-2 w-48 bg-[#272727] py-2 shadow-2xl backdrop-blur-md animate-[fadeIn_0.15s_ease-out]">
          <div className="flex flex-col">
            {locales.map((loc) => (
              <button
                key={loc.code}
                onClick={() => handleSelect(loc.code)}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-all duration-150 cursor-pointer ${
                  loc.code === locale
                    ? "bg-[#151515] text-[#f2f2f2] font-medium"
                    : "text-[#bbb] hover:bg-[#151515] hover:text-[#f2f2f2]"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

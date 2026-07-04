"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export function ExploreDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Header");

  const links = [
    { href: "/popular", label: t("popular") },
    { href: "/new", label: t("new") },
    { href: "/seasons", label: t("seasons") },
    { href: "/calendar", label: t("calendar") },
    { href: "/novelas", label: t("novelas") },
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
        className={`flex h-full items-center gap-1.5 px-4 text-sm font-normal text-[#bbb] hover:text-[#f2f2f2] transition-colors duration-200 hover:bg-[#151515] focus:outline-none ${
          isOpen ? "text-[#f2f2f2] bg-[#151515]" : ""
        }`}
      >
        {t("explore")}
        <ChevronDown size={20} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 w-52 bg-[#151515] py-1.5 shadow-2xl backdrop-blur-md animate-[fadeIn_0.15s_ease-out]">
          <div className="flex flex-col gap-0.5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-2.5 text-sm font-medium text-[#bbb]  hover:text-white hover:bg-[#272727] transition-all duration-150"
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

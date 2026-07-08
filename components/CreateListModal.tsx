"use client";

import { useState } from "react";
import { X } from "lucide-react";
import CreateListForm from "./CreateListForm";
import { useTranslations } from "next-intl";

export default function CreateListModal() {
  const t = useTranslations("Lists");
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 cursor-pointer"
      >
        {t("createList")}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md overflow-hidden border border-zinc-800 bg-zinc-900 p-1 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors cursor-pointer z-20"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Form */}
            <div className="pt-4">
              <CreateListForm isModal onSuccess={closeModal} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

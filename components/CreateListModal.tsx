"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import CreateListForm from "./CreateListForm";

export default function CreateListModal() {
  const t = useTranslations("Lists");
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>{t("createList")}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-[95vw] sm:w-[720px] h-[495px] max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950/95 shadow-2xl shadow-black/80 flex flex-col transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-full transition-all cursor-pointer z-20"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Form */}
            <div className="pt-2">
              <CreateListForm isModal onSuccess={closeModal} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

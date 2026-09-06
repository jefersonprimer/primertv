"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminMediaModal } from "./AdminMediaModal";

export function AddMediaButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative group flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-zinc-200 hover:text-white bg-[#262626] hover:bg-[#333333] border border-[#434343] hover:border-zinc-500 shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
        title="Adicionar Nova Mídia"
      >
        <Plus className="w-5 h-5" />
        <span className="tracking-wide">Criar</span>
      </button>

      <AdminMediaModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        redirectTo="public"
      />
    </>
  );
}

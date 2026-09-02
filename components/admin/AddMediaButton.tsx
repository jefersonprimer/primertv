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
        className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-200 hover:text-white bg-[#262626] hover:bg-[#333333] border border-[#434343] hover:border-zinc-500 shadow-sm transition-all duration-300 active:scale-95 cursor-pointer"
        title="Adicionar Nova Mídia"
      >
        <Plus className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-200" />
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

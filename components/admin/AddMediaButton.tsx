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
        className="flex h-full items-center px-4 text-[#bbb] hover:text-white hover:bg-[#151515] transition-colors"
        title="Adicionar Nova Mídia"
      >
        <Plus size={22} />
      </button>

      <AdminMediaModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        redirectTo="public"
      />
    </>
  );
}

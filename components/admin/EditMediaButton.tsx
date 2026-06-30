"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { AdminCollection } from "@/lib/admin";
import { AdminMediaModal } from "./AdminMediaModal";

type EditMediaButtonProps = {
  collection: AdminCollection;
  item: Record<string, unknown>;
  className?: string;
};

export function EditMediaButton({
  collection,
  item,
  className,
}: EditMediaButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={className || "flex h-10 md:h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm active:scale-95 flex-shrink-0"}
        title="Editar Mídia"
      >
        <Edit size={16} />
        <span>Editar</span>
      </button>

      <AdminMediaModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialCollection={collection}
        item={item}
        redirectTo="public"
      />
    </>
  );
}

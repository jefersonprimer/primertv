"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteList } from "@/app/actions/lists";

interface DeleteListButtonProps {
  listId: string;
  listName: string;
}

export default function DeleteListButton({ listId, listName }: DeleteListButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir a lista "${listName}"?`)) {
      setIsDeleting(true);
      try {
        const res = await deleteList(listId);
        if (!res.success) {
          alert(res.error || "Erro ao deletar lista.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao deletar lista.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
      title="Excluir lista"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteList } from "@/app/actions/lists";
import { useTranslations } from "next-intl";

interface DeleteListButtonProps {
  listId: string;
  listName: string;
}

export default function DeleteListButton({ listId, listName }: DeleteListButtonProps) {
  const t = useTranslations("Lists");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(t("confirmDelete", { listName }))) {
      setIsDeleting(true);
      try {
        const res = await deleteList(listId);
        if (!res.success) {
          alert(res.error || t("deleteError"));
        }
      } catch (err) {
        console.error(err);
        alert(t("deleteError"));
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
      title={t("deleteTitle")}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

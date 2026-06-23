"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/watchlist";
import { revalidatePath } from "next/cache";

export async function createList(name: string, description?: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Você precisa estar logado para criar uma lista." };
  }

  if (!name || name.trim() === "") {
    return { success: false, error: "O nome da lista não pode estar vazio." };
  }

  // Count user lists
  const count = await prisma.customList.count({
    where: { userId },
  });

  if (count >= 10) {
    return { success: false, error: "Você atingiu o limite máximo de 10 listas." };
  }

  try {
    const list = await prisma.customList.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
      },
    });

    revalidatePath("/listas");
    return { success: true, list };
  } catch (err) {
    console.error("Erro ao criar lista: ", err);
    return { success: false, error: "Erro interno ao criar a lista." };
  }
}

export async function toggleAnimeInList(listId: string, animeId?: string, seriesId?: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Você precisa estar logado." };
  }

  if (!animeId && !seriesId) {
    return { success: false, error: "Nenhum ID de mídia fornecido." };
  }

  // Verify list ownership and count items
  const list = await prisma.customList.findUnique({
    where: { id: listId },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });

  if (!list || list.userId !== userId) {
    return { success: false, error: "Lista não encontrada ou sem permissão." };
  }

  // Check if item is already in list
  const existing = await prisma.customListItem.findFirst({
    where: {
      listId,
      ...(animeId ? { animeId } : { seriesId }),
    },
  });

  if (existing) {
    // Remove
    await prisma.customListItem.delete({
      where: {
        id: existing.id,
      },
    });
    revalidatePath("/listas");
    revalidatePath(`/listas/${listId}`);
    return { success: true, inList: false };
  } else {
    // Add - check limit
    if (list._count.items >= 100) {
      return { success: false, error: "Esta lista já atingiu o limite máximo de 100 itens." };
    }

    await prisma.customListItem.create({
      data: {
        listId,
        animeId: animeId || null,
        seriesId: seriesId || null,
      },
    });
    revalidatePath("/listas");
    revalidatePath(`/listas/${listId}`);
    return { success: true, inList: true };
  }
}

export async function getUserListsWithAnimeState(animeId?: string, seriesId?: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return [];

  try {
    const lists = await prisma.customList.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          where: {
            ...(animeId ? { animeId } : { seriesId }),
          },
          select: { animeId: true, seriesId: true },
        },
      },
    });

    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      description: list.description,
      isChecked: list.items.length > 0,
    }));
  } catch (err) {
    console.error("Erro ao obter listas: ", err);
    return [];
  }
}

export async function deleteList(listId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Você precisa estar logado." };
  }

  try {
    const list = await prisma.customList.findUnique({
      where: { id: listId },
    });

    if (!list || list.userId !== userId) {
      return { success: false, error: "Lista não encontrada ou sem permissão." };
    }

    await prisma.customList.delete({
      where: { id: listId },
    });

    revalidatePath("/listas");
    return { success: true };
  } catch (err) {
    console.error("Erro ao deletar lista: ", err);
    return { success: false, error: "Erro ao deletar a lista." };
  }
}

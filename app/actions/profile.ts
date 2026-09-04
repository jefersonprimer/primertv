"use server";

import { getSession, createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";


export async function updateProfile(formData: FormData) {
  const session = await getSession();

  if (!session || !session.user) {
    return { error: "unauthorized" };
  }

  const name = formData.get("name") as string;
  const image = (formData.get("image") as string)?.trim();
  const imageBackground = (formData.get("imageBackground") as string)?.trim();

  if (!name || name.trim().length === 0) {
    return { error: "nameRequired" };
  }

  if (image && !image.startsWith("http://") && !image.startsWith("https://")) {
    return { error: "invalidUrl" };
  }

  if (
    imageBackground &&
    !imageBackground.startsWith("http://") &&
    !imageBackground.startsWith("https://")
  ) {
    return { error: "invalidUrl" };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        image: image || null,
        imageBackground: imageBackground || null,
      },
    });

    const { token, expires } = await createSessionToken({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      image: updatedUser.image,
      imageBackground: updatedUser.imageBackground,
      role: session.user.role,
    });

    (await cookies()).set("session", token, sessionCookieOptions(expires));
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { error: "updateFailed" };
  }
}

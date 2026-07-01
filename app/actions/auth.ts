"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, isAdminEmail, sessionCookieOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type AuthState = {
  error?: string;
};

export async function signup(_prevState: AuthState | undefined, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Todos os campos são obrigatórios." };
  }

  if (isAdminEmail(email)) {
    return { error: "Use o acesso de administrador para este email." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Este email já está em uso." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const { token, expires } = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "user",
  });

  (await cookies()).set("session", token, sessionCookieOptions(expires));

  redirect("/");
}

export async function login(_prevState: AuthState | undefined, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

  if (isAdminEmail(email)) {
    if (!adminPassword || password !== adminPassword) {
      return { error: "Credenciais inválidas." };
    }

    const { token, expires } = await createSessionToken({
      id: "admin",
      name: "Administrador",
      email,
      role: "admin",
    });

    (await cookies()).set("session", token, sessionCookieOptions(expires));

    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { error: "Credenciais inválidas." };
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return { error: "Credenciais inválidas." };
  }

  const { token, expires } = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "user",
  });

  (await cookies()).set("session", token, sessionCookieOptions(expires));

  redirect("/");
}

export async function logout() {
  (await cookies()).delete("session");
  redirect("/login");
}

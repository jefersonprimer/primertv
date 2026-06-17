"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encrypt, isAdminEmail } from "@/lib/auth";
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

  // Create session
  const expires = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
  const session = await encrypt({
    user: { id: user.id, name: user.name, email: user.email, role: "user" },
    expires,
  });

  (await cookies()).set("session", session, { expires, httpOnly: true });

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

    const expires = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
    const session = await encrypt({
      user: {
        id: "admin",
        name: "Administrador",
        email,
        role: "admin",
      },
      expires,
    });

    (await cookies()).set("session", session, { expires, httpOnly: true });

    redirect("/admin");
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

  // Create session
  const expires = new Date(Date.now() + 120 * 60 * 1000); // 2 hours
  const session = await encrypt({ user: { id: user.id, name: user.name, email: user.email, role: "user" }, expires });

  (await cookies()).set("session", session, { expires, httpOnly: true });

  redirect("/");
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/login");
}

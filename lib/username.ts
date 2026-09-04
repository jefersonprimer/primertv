import { prisma } from "@/lib/prisma";

export function slugifyUsername(input: string): string {
  const clean = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "") // keep only lowercase alphanumeric & underscores
    .slice(0, 20); // max 20 chars

  return clean || "user";
}

export async function generateUniqueUsername(nameOrEmail: string): Promise<string> {
  const baseSlug = slugifyUsername(nameOrEmail);
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findFirst({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}${counter}`;
    counter++;
  }
}

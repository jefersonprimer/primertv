import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface ReadRedirectProps {
  params: Promise<{ publicId: string }>;
}

export default async function ReadRedirectPage({
  params,
}: ReadRedirectProps) {
  const { publicId } = await params;

  const chapter = await prisma.chapter.findUnique({
    where: { publicId },
    select: { slug: true, number: true },
  });

  if (!chapter) {
    notFound();
  }

  const slug = chapter.slug || `chapter-${chapter.number}`;
  redirect(`/read/${publicId}/${slug}`);
}

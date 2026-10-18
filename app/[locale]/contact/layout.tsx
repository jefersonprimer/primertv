import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Contato - PrimerTv",
    description:
      "Entre em contato com a equipe do PrimerTv para dúvidas, sugestões ou pedidos.",
    alternates: buildAlternates(locale, "/contact"),
  };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

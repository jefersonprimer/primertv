import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });

  return {
    title: `${t("forgotPasswordTitle")} - PrimerTv`,
    robots: NOINDEX_ROBOTS,
    alternates: buildAlternates(locale, "/forgot-password"),
  };
}

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

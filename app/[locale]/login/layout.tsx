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
    title: `${t("loginTitle")} - primertv`,
    robots: NOINDEX_ROBOTS,
    alternates: buildAlternates(locale, "/login"),
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

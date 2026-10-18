import { redirect } from "@/i18n/routing";
import { getCurrentSeasonSlug } from "@/lib/seasons";
import { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: buildAlternates(locale, "/seasons"),
  };
}

export default async function SeasonsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentSeason = getCurrentSeasonSlug();
  redirect({ href: `/seasons/${currentSeason}`, locale });
}

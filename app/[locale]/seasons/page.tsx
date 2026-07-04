import { redirect } from "@/i18n/routing";
import { getCurrentSeasonSlug } from "@/lib/seasons";

export default async function SeasonsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentSeason = getCurrentSeasonSlug();
  redirect({ href: `/seasons/${currentSeason}`, locale });
}

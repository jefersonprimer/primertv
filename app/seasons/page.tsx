import { redirect } from "next/navigation";
import { getCurrentSeasonSlug } from "@/lib/seasons";

export default function SeasonsRedirectPage() {
  const currentSeason = getCurrentSeasonSlug();
  redirect(`/seasons/${currentSeason}`);
}

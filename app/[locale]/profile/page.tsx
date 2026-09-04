import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user;
  const t = await getTranslations("Profile");

  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    nameLabel: t("nameLabel"),
    namePlaceholder: t("namePlaceholder"),
    avatarLabel: t("avatarLabel"),
    urlPlaceholder: t("urlPlaceholder"),
    presetTitle: t("presetTitle"),
    saveButton: t("saveButton"),
    saving: t("saving"),
    successMessage: t("successMessage"),
    nameRequired: t("nameRequired"),
    invalidUrl: t("invalidUrl"),
    updateFailed: t("updateFailed"),
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0E0E0E] py-10 px-4">
      <ProfileForm user={user} t={translations} />
    </div>
  );
}

import type { Metadata } from "next";
import "../globals.css";
import { Header } from "@/components/Header";
import { HeaderSkeleton } from "@/components/HeaderSkeleton";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Footer } from "@/components/Footer";
import { metadataBase, buildOpenGraph, buildTwitter } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

interface GenerateMetadataProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: GenerateMetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Layout" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    metadataBase,
    title,
    description,
    verification: {
      google: "iFNvvYLli4pLzw8Ne01U4uBkal2KzUsQdMzQ8Wjcy5M",
    },
    openGraph: buildOpenGraph({
      title,
      description,
      locale,
      type: "website",
      url: `${SITE_URL}/${locale}`,
    }),
    twitter: buildTwitter({
      card: "summary_large_image",
      title,
      description,
    }),
  };
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col text-zinc-100">
        <NextIntlClientProvider messages={messages}>
          <Suspense fallback={<HeaderSkeleton />}>
            <Header />
          </Suspense>
          <main className="flex-1 pt-14 2xl:pt-16">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

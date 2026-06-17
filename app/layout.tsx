import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { HeaderSkeleton } from "@/components/HeaderSkeleton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "PrimerTV",
  description: "Seus animes e séries favoritos em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
        <Suspense fallback={<HeaderSkeleton />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

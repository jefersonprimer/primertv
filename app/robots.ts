import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const LOCALE_ROUTES = [
  "watchlist",
  "history",
  "search",
  "profile",
  "lists",
  "login",
  "signup",
  "forgot-password",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          // Rotas pessoais/indexáveis sem valor de busca (sem prefixo de locale
          // e com curinga para /{locale}/... — localePrefix: "always")
          ...LOCALE_ROUTES.map((route) => `/${route}`),
          ...LOCALE_ROUTES.map((route) => `/*/${route}`),
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

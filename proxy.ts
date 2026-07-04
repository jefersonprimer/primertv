import { NextRequest } from "next/server";
import { decrypt, encrypt, getSessionExpires, sessionCookieOptions } from "./lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // 1. Run next-intl middleware to handle locale redirection and rewriting
  const response = intlMiddleware(request);

  // 2. Update/refresh the session token if the user has an active session cookie
  const session = request.cookies.get("session")?.value;
  if (session) {
    try {
      const parsed = await decrypt(session);
      const expires = getSessionExpires();
      response.cookies.set({
        name: "session",
        value: await encrypt({ user: parsed.user, expires }),
        ...sessionCookieOptions(expires),
      });
    } catch {
      response.cookies.delete("session");
    }
  }

  return response;
}

export const config = {
  // Match all paths except API routes, Next.js internal paths, Vercel analytics, and files with extensions (static assets)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

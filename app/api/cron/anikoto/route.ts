import { NextResponse } from "next/server";

import { syncAnikotoCatalog } from "@/lib/anikoto-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${secret}`) return true;

  const querySecret = new URL(request.url).searchParams.get("secret");
  return querySecret === secret;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedPages = Number(searchParams.get("pages") ?? 0);
  const maxPages = requestedPages > 0 ? requestedPages : undefined;

  const result = await syncAnikotoCatalog({ maxPages });
  return NextResponse.json({ ok: true, ...result });
}

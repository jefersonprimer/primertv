import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);
const adminEmail = process.env.ADMIN_EMAIL?.trim() || "adminprimerlabs@gmail.com";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "user";
};

export type SessionPayload = {
  user: SessionUser;
  expires: Date;
};

export function isAdminEmail(email?: string | null) {
  return Boolean(email && email === adminEmail);
}

export function getSessionExpires() {
  return new Date(Date.now() + SESSION_MAX_AGE_MS);
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}

export async function createSessionToken(user: SessionUser) {
  const expires = getSessionExpires();
  const token = await encrypt({ user, expires });
  return { token, expires };
}

export async function encrypt(payload: SessionPayload) {
  const expires =
    payload.expires instanceof Date
      ? payload.expires
      : new Date(payload.expires);

  return await new SignJWT({ user: payload.user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  const data = payload as { user: SessionUser; expires?: string | number | Date };

  return {
    user: data.user,
    expires: new Date(data.expires ?? Date.now() + SESSION_MAX_AGE_MS),
  };
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;

  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return NextResponse.next();

  try {
    const parsed = await decrypt(session);
    const expires = getSessionExpires();
    const res = NextResponse.next();

    res.cookies.set({
      name: "session",
      value: await encrypt({ user: parsed.user, expires }),
      ...sessionCookieOptions(expires),
    });

    return res;
  } catch {
    const res = NextResponse.next();
    res.cookies.delete("session");
    return res;
  }
}

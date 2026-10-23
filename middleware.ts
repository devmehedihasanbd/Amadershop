/* ------------------------------------------------------------------ */
/*  Admin route protection.                                             */
/*                                                                     */
/*  Runs on every request to /admin/* (except /admin/login).           */
/*  Verifies the HMAC-SHA256 signed session cookie using Web Crypto    */
/*  (Edge runtime) and redirects unauthenticated visitors to the      */
/*  login page. API routes under /api/admin/* enforce auth themselves */
/*  via requireAdminApi() and are not matched here.                    */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "amader_admin";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Timing-safe hex string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Verify a `v1.<expiry>.<sig>` session token. Mirrors the signing logic
 * in lib/admin-auth.ts (HMAC-SHA256 over `admin-session.<expiry>` with
 * sha256(ADMIN_PASSWORD) as the key).
 */
async function verifySessionToken(token: string, password: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expiry = Number(parts[1]);
  if (!Number.isFinite(expiry) || expiry <= Date.now() / 1000) return false;

  const pwHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  const key = await crypto.subtle.importKey(
    "raw",
    pwHash,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`admin-session.${parts[1]}`)
  );
  return safeEqual(parts[2], toHex(new Uint8Array(sig)));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page itself is public.
  if (pathname === "/admin/login") return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD ?? "";
  const token = request.cookies.get(COOKIE_NAME)?.value ?? "";

  if (password && token && (await verifySessionToken(token, password))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};

/* ------------------------------------------------------------------ */
/*  Admin authentication.                                               */
/*                                                                     */
/*  - Password checked with a timing-safe comparison against           */
/*    process.env.ADMIN_PASSWORD (never stored anywhere else).        */
/*  - Sessions are HMAC-SHA256 signed tokens using ADMIN_PASSWORD as   */
/*    the HMAC key: `v1.<expiryEpoch>.<hexSig>` over "admin-session".  */
/*  - Cookie: `amader_admin`, HttpOnly, SameSite=Lax, Secure in        */
/*    production, Path=/, 7-day max-age.                              */
/*  - When ADMIN_PASSWORD is not configured, every check fails closed */
/*    (no login possible, no session valid).                           */
/* ------------------------------------------------------------------ */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "amader_admin";
export const ADMIN_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function sha256Hex(input: string): Buffer {
  return createHash("sha256").update(input, "utf8").digest();
}

/** Timing-safe password check against ADMIN_PASSWORD. */
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !input) return false;
  const a = sha256Hex(input);
  const b = sha256Hex(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function hmacKey(): Buffer {
  // Derive a fixed-length key from the password.
  return sha256Hex(process.env.ADMIN_PASSWORD ?? "");
}

function signPayload(expiry: number): string {
  return createHmac("sha256", hmacKey())
    .update(`admin-session.${expiry}`, "utf8")
    .digest("hex");
}

/** Create a fresh signed session token. */
export function createAdminSessionToken(): string {
  const expiry = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  return `v1.${expiry}.${signPayload(expiry)}`;
}

/** Validate a session token's signature and expiry. */
export function verifyAdminSessionToken(token: string): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const expiry = Number(parts[1]);
  if (!Number.isFinite(expiry) || expiry <= Date.now() / 1000) return false;
  const expected = signPayload(expiry);
  const a = Buffer.from(parts[2], "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface AdminCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}

export function adminCookieOptions(): AdminCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}

/** True when the request carries a valid admin session cookie. */
export async function getAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}

/** For server components/pages: redirect to login when not authenticated. */
export async function requireAdmin(): Promise<void> {
  if (!(await getAdminSession())) redirect("/admin/login");
}

/**
 * For API route handlers: returns a 401 JSON response when not
 * authenticated, or null when the request is authorized.
 */
export async function requireAdminApi(): Promise<NextResponse | null> {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

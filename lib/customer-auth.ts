/* ------------------------------------------------------------------ */
/*  Customer account authentication (optional accounts).               */
/*                                                                     */
/*  - Passwords: PBKDF2-SHA256, 100k iterations, per-user salt.        */
/*  - Sessions: HMAC-SHA256 signed tokens `v1.<id>.<expiry>.<sig>`     */
/*    over "customer-session", mirroring the admin session pattern.    */
/*  - The HMAC secret lives in the Setting table                       */
/*    (key: customer_session_secret) so no Vercel env change is needed; */
/*    it is created once, lazily, and never leaves the server.         */
/*  - Cookie: `amader_customer`, HttpOnly, SameSite=Lax, Secure in     */
/*    production, Path=/, 30-day max-age.                              */
/*  - Guest checkout is untouched: a Customer row only becomes an      */
/*    account when its owner registers with that phone number.         */
/* ------------------------------------------------------------------ */

import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { PrismaClient } from "@prisma/client";

export const CUSTOMER_COOKIE_NAME = "amader_customer";
export const CUSTOMER_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SESSION_SECRET_KEY = "customer_session_secret";

/** Bangladeshi mobile, same rule as checkout. */
export function normalizePhone(raw: string): string {
  return (raw ?? "").replace(/[\s-]/g, "");
}

export function isValidBdMobile(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}

/** Hash a password for storage: `pbkdf2$100000$<saltHex>$<hashHex>`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return `pbkdf2$100000$${salt}$${hash}`;
}

/** Timing-safe password check against a stored hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(parts[3], "hex");
  } catch {
    return false;
  }
  const actual = pbkdf2Sync(password, parts[2], iterations, 32, "sha256");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Read the session secret, creating it once if it does not exist yet. */
export async function getSessionSecret(db: PrismaClient): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: SESSION_SECRET_KEY } });
  if (row) return row.value;
  const secret = randomBytes(32).toString("hex");
  const created = await db.setting.upsert({
    where: { key: SESSION_SECRET_KEY },
    update: {},
    create: { key: SESSION_SECRET_KEY, value: secret },
  });
  return created.value;
}

function signPayload(customerId: string, expiry: number, secret: string): string {
  return createHmac("sha256", secret)
    .update(`customer-session.${customerId}.${expiry}`, "utf8")
    .digest("hex");
}

/** Create a fresh signed session token for a customer. */
export function createCustomerSessionToken(customerId: string, secret: string): string {
  const expiry = Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_TTL_SECONDS;
  return `v1.${customerId}.${expiry}.${signPayload(customerId, expiry, secret)}`;
}

/** Validate a token; returns the customer id, or null when invalid. */
export function verifyCustomerSessionToken(token: string, secret: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  const customerId = parts[1];
  const expiry = Number(parts[2]);
  if (!customerId || !Number.isFinite(expiry) || expiry <= Date.now() / 1000) {
    return null;
  }
  const expected = signPayload(customerId, expiry, secret);
  const a = Buffer.from(parts[3], "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b) ? customerId : null;
}

export function customerCookieOptions(): {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_SESSION_TTL_SECONDS,
  };
}

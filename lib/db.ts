/* ------------------------------------------------------------------ */
/*  Prisma client singleton (Neon serverless).                         */
/*                                                                     */
/*  - Uses @prisma/adapter-neon so queries run over Neon's HTTP/WS    */
/*    serverless driver (no persistent TCP pool needed).              */
/*  - `ws` is registered as the WebSocket constructor for Node.       */
/*  - Never throws at import time: when DATABASE_URL is missing,      */
/*    getDb() returns null and callers fall back to mock data.        */
/* ------------------------------------------------------------------ */

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

type GlobalWithPrisma = typeof globalThis & {
  __bazarghorPrisma?: PrismaClient;
};

/** True when a database connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Returns the shared PrismaClient, or null when DATABASE_URL is not set.
 * Safe to call at build time and in mock mode.
 */
export function getDb(): PrismaClient | null {
  if (!isDbConfigured()) return null;
  const g = globalThis as GlobalWithPrisma;
  if (!g.__bazarghorPrisma) {
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL!.trim(),
    });
    g.__bazarghorPrisma = new PrismaClient({ adapter });
  }
  return g.__bazarghorPrisma;
}

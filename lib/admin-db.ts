/* ------------------------------------------------------------------ */
/*  Shared helper for /api/admin/* route handlers.                     */
/*                                                                     */
/*  Every admin API route must first call requireAdminApi() (auth)      */
/*  and then requireDb() (database). Both fail closed.                 */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client";
import { getDb } from "./db";

export type DbResult = { db: PrismaClient } | { response: NextResponse };

export function requireDb(): DbResult {
  const db = getDb();
  if (!db) {
    return {
      response: NextResponse.json(
        { error: "Database not configured." },
        { status: 503 }
      ),
    };
  }
  return { db };
}

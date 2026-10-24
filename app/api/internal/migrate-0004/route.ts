import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * TEMPORARY one-shot endpoint: applies migration 0004_banners
 * (creates the Banner table) on the live database, then this file
 * is deleted. Guarded by a single-use bearer token in MIGRATION_TOKEN.
 *
 * Why this exists: this sandbox has no direct Postgres TCP access, so
 * `prisma migrate deploy` cannot run from here. The Vercel runtime DOES
 * have DATABASE_URL, so the migration runs from inside the deployment.
 */
const MIGRATION_NAME = "0004_banners";

export async function POST(request: Request) {
  const token = process.env.MIGRATION_TOKEN;
  const auth = request.headers.get("authorization") ?? "";
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  try {
    const sql = neon(databaseUrl);

    // 1. Run each statement of the committed migration file.
    const migrationFile = await readFile(
      join(process.cwd(), "prisma", "migrations", MIGRATION_NAME, "migration.sql"),
      "utf8"
    );
    const cleaned = migrationFile
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    const statements = cleaned
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      // CREATE TYPE is not idempotent; skip it when the type already exists.
      if (/^CREATE TYPE/i.test(stmt)) {
        const existing = await sql`
          SELECT 1 FROM pg_type WHERE typname = 'BannerPlacement'
        `;
        if (existing.length > 0) continue;
      }
      await sql.query(stmt);
    }

    // 2. Confirm the table exists.
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'Banner'
    `;
    if (tables.length === 0) {
      return NextResponse.json({ error: "Banner table was not created." }, { status: 500 });
    }

    // 3. Record the migration for Prisma bookkeeping.
    const checksum = createHash("sha256").update(migrationFile).digest("hex");
    const existing = await sql`
      SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${MIGRATION_NAME}
    `;
    let recorded = existing.length > 0;
    if (!recorded) {
      await sql`
        INSERT INTO "_prisma_migrations"
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES
          (gen_random_uuid()::text, ${checksum}, NOW(), ${MIGRATION_NAME}, '', NULL, NOW(), 1)
      `;
      recorded = true;
    }

    return NextResponse.json({
      ok: true,
      statements: statements.length,
      migrationRecorded: recorded,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Migration failed: ${message}` }, { status: 500 });
  }
}

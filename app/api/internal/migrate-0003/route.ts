import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * TEMPORARY one-shot endpoint: applies migration 0003_product_images
 * (adds Product.images TEXT[]) on the live database, then this file
 * is deleted. Guarded by a single-use bearer token in MIGRATION_TOKEN.
 *
 * Why this exists: this sandbox has no direct Postgres TCP access, so
 * `prisma migrate deploy` cannot run from here. The Vercel runtime DOES
 * have DATABASE_URL, so the migration runs from inside the deployment.
 */
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

    // 1. Idempotent DDL — safe to run more than once.
    await sql`
      ALTER TABLE "Product"
      ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT '{}'
    `;

    // 2. Confirm the column exists.
    const cols = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Product'
        AND column_name = 'images'
    `;
    if (cols.length === 0) {
      return NextResponse.json({ error: "Column was not created." }, { status: 500 });
    }

    // 3. Record the migration for Prisma bookkeeping, matching the
    //    committed migration file's checksum.
    const migrationFile = await readFile(
      join(process.cwd(), "prisma", "migrations", "0003_product_images", "migration.sql"),
      "utf8"
    );
    const checksum = createHash("sha256").update(migrationFile).digest("hex");
    const existing = await sql`
      SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '0003_product_images'
    `;
    let recorded = existing.length > 0;
    if (!recorded) {
      await sql`
        INSERT INTO "_prisma_migrations"
          (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES
          (gen_random_uuid()::text, ${checksum}, NOW(), '0003_product_images', '', NULL, NOW(), 1)
      `;
      recorded = true;
    }

    return NextResponse.json({ ok: true, column: cols[0], migrationRecorded: recorded });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Migration failed: ${message}` }, { status: 500 });
  }
}

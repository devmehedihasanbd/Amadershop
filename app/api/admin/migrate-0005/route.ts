import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/**
 * ONE-TIME migration runner for 0005 (category image + optional product
 * category). DELETE THIS FILE after it has run once — it is not part of
 * the app. Guarded by a single-use token (not the admin password).
 *
 * Usage: GET /api/admin/migrate-0005?token=<token>
 */
export const dynamic = "force-dynamic";

const MIGRATION_NAME = "0005_category_image_optional_product_category";
// sha256 of prisma/migrations/0005_category_image_optional_product_category/migration.sql
const CHECKSUM = "5bf259e49d0beeaa9827089ca6b2d0d1bcd089b0bc31002073df8c5bd2cb322e";
const TOKEN = "280419790a7a876f4b3a090257f44adf8ce4e3e4a9ff7016";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("token") !== TOKEN) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  const sql = neon(url);

  type ColRow = { table_name: string; column_name: string; is_nullable: string };
  async function columnState(): Promise<ColRow[]> {
    const rows = await sql`
      SELECT "table_name", "column_name", "is_nullable"
      FROM "information_schema"."columns"
      WHERE "table_name" IN ('Category', 'Product')
        AND "column_name" IN ('image', 'categoryId')
    `;
    return rows as unknown as ColRow[];
  }
  async function verify(): Promise<{ imageColumn: boolean; categoryNullable: boolean }> {
    const cols = await columnState();
    return {
      imageColumn: cols.some(
        (c) => c.table_name === "Category" && c.column_name === "image"
      ),
      categoryNullable: cols.some(
        (c) => c.table_name === "Product" && c.column_name === "categoryId" && c.is_nullable === "YES"
      ),
    };
  }

  try {
    const existing = await sql`
      SELECT "migration_name" FROM "_prisma_migrations"
      WHERE "migration_name" = ${MIGRATION_NAME}
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({
        alreadyApplied: true,
        ...(await verify()),
      });
    }

    const cols = await columnState();
    const hasImage = cols.some(
      (c) => c.table_name === "Category" && c.column_name === "image"
    );
    const catNullable = cols.some(
      (c) => c.table_name === "Product" && c.column_name === "categoryId" && c.is_nullable === "YES"
    );

    const ran: string[] = [];
    if (!hasImage) {
      await sql`ALTER TABLE "Category" ADD COLUMN "image" TEXT`;
      ran.push("Category.image added");
    }
    if (!catNullable) {
      await sql`ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL`;
      ran.push("Product.categoryId made nullable");
    }

    const id = `c${Array.from({ length: 24 }, () =>
      "abcdefghijklmnopqrstuvwxyz0123456789".charAt(Math.floor(Math.random() * 36))
    ).join("")}`;
    await sql`
      INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (${id}, ${CHECKSUM}, NOW(), ${MIGRATION_NAME}, '', NULL, NOW(), 1)
    `;

    return NextResponse.json({
      applied: true,
      ran,
      ...(await verify()),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Migration failed.", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

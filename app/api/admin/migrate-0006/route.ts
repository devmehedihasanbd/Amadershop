import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/**
 * ONE-TIME migration runner for 0006 (customer accounts). DELETE THIS
 * FILE after it has run once — it is not part of the app. Guarded by a
 * single-use token (not the admin password).
 *
 * Usage: GET /api/admin/migrate-0006?token=<token>
 */
export const dynamic = "force-dynamic";

const MIGRATION_NAME = "0006_customer_accounts";
// sha256 of prisma/migrations/0006_customer_accounts/migration.sql
const CHECKSUM = "e36e9b812ed76252c2b0ac45c98bdaf211e9486ad3c6c5e87632b2b49e76af05";
const TOKEN = "94113c6fdf0d45c37621326ac65bd2bfe0066a32373e796a";

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

  type ColRow = { column_name: string };
  async function columnState(): Promise<Set<string>> {
    const rows = (await sql`
      SELECT "column_name"
      FROM "information_schema"."columns"
      WHERE "table_name" = 'Customer'
    `) as unknown as ColRow[];
    return new Set(rows.map((r) => r.column_name));
  }
  async function indexExists(): Promise<boolean> {
    const rows = (await sql`
      SELECT "indexname" FROM "pg_indexes"
      WHERE "tablename" = 'Customer' AND "indexname" = 'Customer_email_key'
    `) as unknown as { indexname: string }[];
    return rows.length > 0;
  }
  async function verify(): Promise<{
    columns: string[];
    emailIndex: boolean;
  }> {
    const cols = await columnState();
    return {
      columns: ["passwordHash", "email", "authProvider", "providerId"].filter((c) =>
        cols.has(c)
      ),
      emailIndex: await indexExists(),
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
    const ran: string[] = [];
    if (!cols.has("passwordHash")) {
      await sql`ALTER TABLE "Customer" ADD COLUMN "passwordHash" TEXT`;
      ran.push("Customer.passwordHash added");
    }
    if (!cols.has("email")) {
      await sql`ALTER TABLE "Customer" ADD COLUMN "email" TEXT`;
      ran.push("Customer.email added");
    }
    if (!cols.has("authProvider")) {
      await sql`ALTER TABLE "Customer" ADD COLUMN "authProvider" TEXT`;
      ran.push("Customer.authProvider added");
    }
    if (!cols.has("providerId")) {
      await sql`ALTER TABLE "Customer" ADD COLUMN "providerId" TEXT`;
      ran.push("Customer.providerId added");
    }
    if (!(await indexExists())) {
      await sql`CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email")`;
      ran.push("Customer_email_key created");
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

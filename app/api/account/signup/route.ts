import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSessionToken,
  customerCookieOptions,
  getSessionSecret,
  hashPassword,
  isValidBdMobile,
  normalizePhone,
} from "@/lib/customer-auth";

/**
 * Create a customer account with a phone number + password.
 * If the phone already belongs to a guest Customer row (from an order),
 * that row is upgraded to an account, keeping its order history.
 * Guest checkout keeps working without any account.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Accounts are unavailable right now." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const name = String(b.name ?? "").trim();
  const phone = normalizePhone(String(b.phone ?? ""));
  const password = String(b.password ?? "");

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "Please enter your name (2–80 characters)." },
      { status: 400 }
    );
  }
  if (!isValidBdMobile(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 11-digit mobile number (e.g. 01712345678)." },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const existing = await db.customer.findUnique({ where: { phone } });
  if (existing?.passwordHash) {
    return NextResponse.json(
      { error: "This number already has an account. Please log in instead." },
      { status: 409 }
    );
  }

  const passwordHash = hashPassword(password);
  const customer = existing
    ? await db.customer.update({
        where: { phone },
        data: { name, passwordHash, authProvider: "phone" },
      })
    : await db.customer.create({
        data: {
          name,
          phone,
          address: "",
          area: "",
          passwordHash,
          authProvider: "phone",
        },
      });

  const secret = await getSessionSecret(db);
  const token = createCustomerSessionToken(customer.id, secret);
  const res = NextResponse.json({
    customer: { name: customer.name, phone: customer.phone },
  });
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, customerCookieOptions());
  return res;
}

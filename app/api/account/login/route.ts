import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  CUSTOMER_COOKIE_NAME,
  createCustomerSessionToken,
  customerCookieOptions,
  getSessionSecret,
  isValidBdMobile,
  normalizePhone,
  verifyPassword,
} from "@/lib/customer-auth";

/** Log in with a phone number + password. */
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

  const phone = normalizePhone(String(b.phone ?? ""));
  const password = String(b.password ?? "");

  if (!isValidBdMobile(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 11-digit mobile number (e.g. 01712345678)." },
      { status: 400 }
    );
  }

  const customer = await db.customer.findUnique({ where: { phone } });
  if (!customer || !customer.passwordHash) {
    return NextResponse.json(
      { error: "No account found for this number. Please sign up first." },
      { status: 400 }
    );
  }
  if (!verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const secret = await getSessionSecret(db);
  const token = createCustomerSessionToken(customer.id, secret);
  const res = NextResponse.json({
    customer: { name: customer.name, phone: customer.phone },
  });
  res.cookies.set(CUSTOMER_COOKIE_NAME, token, customerCookieOptions());
  return res;
}

import { NextResponse } from "next/server";
import {
  CUSTOMER_COOKIE_NAME,
  customerCookieOptions,
} from "@/lib/customer-auth";

/** Log out: clear the customer session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_COOKIE_NAME, "", {
    ...customerCookieOptions(),
    maxAge: 0,
  });
  return res;
}

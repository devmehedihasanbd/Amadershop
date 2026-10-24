import type { Metadata } from "next";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin — Amader Shop",
  robots: { index: false, follow: false },
};

// Allow blocking dynamic access (auth + DB) instead of failing the prerender.

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced by middleware.ts (redirects to /admin/login).
  // connection() opts this subtree out of static prerendering so every
  // visit renders fresh data.
  await connection();
  return <AdminShell>{children}</AdminShell>;
}

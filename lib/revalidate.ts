import { revalidatePath } from "next/cache";

/**
 * Purge the storefront's cached pages after an admin change, so the next
 * visit to any page re-renders with fresh database data. Without this,
 * statically rendered pages would keep showing the pre-change content
 * until the next deployment — the admin and the storefront share one
 * database, but the storefront's HTML was frozen at build time.
 */
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}

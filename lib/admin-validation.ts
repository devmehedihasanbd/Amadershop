/* ------------------------------------------------------------------ */
/*  Server-side validation for admin create/update payloads.           */
/* ------------------------------------------------------------------ */

/** Turn a product name into a URL-safe slug. */
export function slugify(raw: string): string {
  return (raw ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function isValidSlug(raw: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw);
}

export const MAX_PRODUCT_IMAGES = 3;
/** Max encoded size per photo (~1.5 MB of base64 ≈ 1.1 MB of image bytes). */
const MAX_IMAGE_LENGTH = 1_500_000;

export interface ProductInput {
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  oldPrice: number | null;
  unit: string;
  stock: number;
  badge: string | null;
  rating: number;
  description: string;
  details: string[];
  images: string[];
}

const VALID_BADGES = ["best-selling", "new"] as const;

export function validateProductInput(body: unknown): {
  data: ProductInput;
  errors: string[];
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = String(b.name ?? "").trim();
  if (!name) errors.push("Name is required.");
  if (name.length > 120) errors.push("Name must be 120 characters or fewer.");

  const rawSlug = String(b.slug ?? "").trim().toLowerCase();
  const slug = rawSlug || slugify(name);
  if (!isValidSlug(slug)) errors.push("Slug may only contain lowercase letters, numbers and hyphens.");

  const categorySlug = String(b.categorySlug ?? b.category ?? "").trim();
  if (!categorySlug) errors.push("Category is required.");

  const price = Number(b.price);
  if (!Number.isInteger(price) || price < 0 || price > 1000000) {
    errors.push("Price must be a whole number of taka (0 – 1,000,000).");
  }

  let oldPrice: number | null = null;
  if (b.oldPrice !== undefined && b.oldPrice !== null && String(b.oldPrice).trim() !== "") {
    const op = Number(b.oldPrice);
    if (!Number.isInteger(op) || op < 0 || op > 1000000) {
      errors.push("Old price must be a whole number of taka, or left empty.");
    } else {
      oldPrice = op;
    }
  }

  const unit = String(b.unit ?? "").trim();
  if (!unit) errors.push("Unit is required (e.g. 1 kg, 500 g).");

  const stock = Number(b.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) {
    errors.push("Stock must be a whole number (0 – 100,000).");
  }

  let badge: string | null = null;
  const rawBadge = String(b.badge ?? "").trim();
  if (rawBadge) {
    if (!(VALID_BADGES as readonly string[]).includes(rawBadge)) {
      errors.push("Badge must be empty, best-selling or new.");
    } else {
      badge = rawBadge;
    }
  }

  const rating = Number(b.rating ?? 4.5);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    errors.push("Rating must be between 0 and 5.");
  }

  const description = String(b.description ?? "").trim();
  if (!description) errors.push("Description is required.");

  const detailsRaw = b.details;
  let details: string[] = [];
  if (Array.isArray(detailsRaw)) {
    details = detailsRaw.map((d) => String(d).trim()).filter(Boolean).slice(0, 20);
  } else if (typeof detailsRaw === "string") {
    details = detailsRaw.split("\n").map((d) => d.trim()).filter(Boolean).slice(0, 20);
  }

  const { images, errors: imageErrors } = validateImages(b.images);
  errors.push(...imageErrors);

  return {
    data: { name, slug, categorySlug, price, oldPrice, unit, stock, badge, rating, description, details, images },
    errors,
  };
}

/**
 * Validate the product photo list. Accepts data-URLs produced by the admin
 * uploader (client-side compressed JPEGs) or plain https URLs.
 */
export function validateImages(raw: unknown): { images: string[]; errors: string[] } {
  const errors: string[] = [];
  if (raw === undefined || raw === null || raw === "") return { images: [], errors };
  if (!Array.isArray(raw)) {
    return { images: [], errors: ["Photos must be sent as a list."] };
  }
  if (raw.length > MAX_PRODUCT_IMAGES) {
    errors.push(`At most ${MAX_PRODUCT_IMAGES} photos per product.`);
  }
  const images: string[] = [];
  for (const item of raw.slice(0, MAX_PRODUCT_IMAGES)) {
    const s = String(item ?? "").trim();
    const isDataUrl = /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s);
    const isHttpUrl = /^https?:\/\/[^\s]+$/i.test(s) && s.length <= 2000;
    if (!isDataUrl && !isHttpUrl) {
      errors.push("Each photo must be an uploaded image or an http(s) URL.");
      continue;
    }
    if (s.length > MAX_IMAGE_LENGTH) {
      errors.push("One photo is too large — please use a smaller image.");
      continue;
    }
    images.push(s);
  }
  return { images, errors };
}

export interface CategoryInput {
  name: string;
  slug: string;
  tagline: string;
  sortOrder: number;
}

export function validateCategoryInput(body: unknown): {
  data: CategoryInput;
  errors: string[];
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = String(b.name ?? "").trim();
  if (!name) errors.push("Name is required.");

  const rawSlug = String(b.slug ?? "").trim().toLowerCase();
  const slug = rawSlug || slugify(name);
  if (!isValidSlug(slug)) errors.push("Slug may only contain lowercase letters, numbers and hyphens.");

  const tagline = String(b.tagline ?? b.description ?? "").trim();
  const sortOrder = Number(b.sortOrder ?? 0);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
    errors.push("Sort order must be a whole number (0 – 10,000).");
  }

  return { data: { name, slug, tagline, sortOrder }, errors };
}

export interface PromoInput {
  code: string;
  percent: number;
  minOrder: number;
  maxDiscount: number;
  active: boolean;
}

export function validatePromoInput(body: unknown): {
  data: PromoInput;
  errors: string[];
} {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const code = String(b.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) errors.push("Code is required.");
  if (!/^[A-Z0-9]{2,20}$/.test(code)) {
    errors.push("Code must be 2–20 uppercase letters/digits.");
  }

  const percent = Number(b.percent);
  if (!Number.isInteger(percent) || percent < 1 || percent > 90) {
    errors.push("Percent must be a whole number (1 – 90).");
  }

  const minOrder = Number(b.minOrder ?? 0);
  if (!Number.isInteger(minOrder) || minOrder < 0 || minOrder > 1000000) {
    errors.push("Min order must be a whole number of taka.");
  }

  const maxDiscount = Number(b.maxDiscount ?? 0);
  if (!Number.isInteger(maxDiscount) || maxDiscount < 0 || maxDiscount > 1000000) {
    errors.push("Max discount must be a whole number of taka.");
  }

  const active = b.active === undefined ? true : Boolean(b.active);

  return { data: { code, percent, minOrder, maxDiscount, active }, errors };
}

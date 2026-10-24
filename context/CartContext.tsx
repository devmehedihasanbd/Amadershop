"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getProduct } from "@/lib/products";
import type { Product } from "@/lib/products";

export interface CartLine {
  slug: string;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (slug: string, qty?: number) => void;
  removeItem: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  /**
   * Resolve a cart line to its product. Checks products fetched from the
   * live catalog first (these include admin-added products and photos),
   * then falls back to the bundled mock catalog.
   */
  resolveProduct: (slug: string) => Product | undefined;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bazarghor-cart-v1";

function loadInitial(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return parsed.filter(
      (l) =>
        typeof l?.slug === "string" &&
        l.slug.length > 0 &&
        Number.isInteger(l.qty) &&
        l.qty > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadInitial);
  const [isOpen, setOpen] = useState(false);
  // Products fetched from the live API (DB-first), keyed by slug.
  const [fetched, setFetched] = useState<Record<string, Product>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  const resolveProduct = useCallback(
    (slug: string): Product | undefined => fetched[slug] ?? getProduct(slug),
    [fetched]
  );

  // Lazily fetch any cart slugs the bundled catalog doesn't know
  // (e.g. products added later through the admin panel).
  useEffect(() => {
    const missing = lines
      .map((l) => l.slug)
      .filter(
        (slug) =>
          !getProduct(slug) && !fetched[slug] && !fetchingRef.current.has(slug)
      );
    if (missing.length === 0) return;
    const unique = [...new Set(missing)];
    unique.forEach((s) => fetchingRef.current.add(s));
    let cancelled = false;
    fetch(`/api/products?slugs=${unique.map(encodeURIComponent).join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json || !Array.isArray(json.products)) return;
        setFetched((prev) => {
          const next = { ...prev };
          for (const p of json.products as Product[]) {
            if (p && typeof p.slug === "string") next[p.slug] = p;
          }
          return next;
        });
      })
      .catch(() => {
        /* offline or API down — mock fallback still applies */
      })
      .finally(() => {
        unique.forEach((s) => fetchingRef.current.delete(s));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable — cart still works in memory */
    }
  }, [lines]);

  const addItem = useCallback((slug: string, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.slug === slug);
      if (existing) {
        return prev.map((l) =>
          l.slug === slug ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...prev, { slug, qty }];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, qty } : l))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const l of lines) {
      const p = fetched[l.slug] ?? getProduct(l.slug);
      if (!p) continue;
      c += l.qty;
      s += p.price * l.qty;
    }
    return { count: c, subtotal: s };
  }, [lines, fetched]);

  const value = useMemo(
    () => ({
      lines,
      addItem,
      removeItem,
      setQty,
      clear,
      count,
      subtotal,
      isOpen,
      setOpen,
      resolveProduct,
    }),
    [
      lines,
      addItem,
      removeItem,
      setQty,
      clear,
      count,
      subtotal,
      isOpen,
      resolveProduct,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

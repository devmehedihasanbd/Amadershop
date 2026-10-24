"use client";

import { useEffect, useState } from "react";

export interface SiteSettings {
  announcement: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  storeName: string;
  storeTagline: string;
  logoImage: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  storeAddress: string;
  openHours: string;
  facebookUrl: string;
  instagramUrl: string;
  footerAbout: string;
}

// Module-level cache: fetched once per page load, shared by Header/Footer.
let cache: SiteSettings | null = null;
let inflight: Promise<SiteSettings | null> | null = null;

function load(): Promise<SiteSettings | null> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        cache = (json as SiteSettings | null) ?? null;
        return cache;
      })
      .catch(() => null);
  }
  return inflight;
}

/** Live store identity/contact settings; null until loaded (use defaults). */
export function useSiteSettings(): SiteSettings | null {
  const [settings, setSettings] = useState<SiteSettings | null>(cache);
  useEffect(() => {
    let cancelled = false;
    load().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return settings;
}

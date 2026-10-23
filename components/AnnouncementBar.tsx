"use client";

import { useEffect, useState } from "react";

/**
 * Slim announcement bar at the very top of the storefront.
 * Reads the `announcement` setting; renders nothing when empty.
 */
export default function AnnouncementBar() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.announcement === "string" && d.announcement.trim()) {
          setText(d.announcement.trim());
        }
      })
      .catch(() => {
        /* announcement is optional — stay hidden on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!text) return null;

  return (
    <div className="bg-green-800 px-4 py-2 text-center text-sm font-medium text-amber-100">
      {text}
    </div>
  );
}

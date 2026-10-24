"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Quick on/off switch for a banner. PATCH validates the full payload,
 * so we reload the banner's current values and resubmit with active flipped.
 */
export default function BannerActiveToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(active);

  async function toggle() {
    setBusy(true);
    try {
      const current = await fetch(`/api/admin/banners/${id}`).then((r) =>
        r.ok ? r.json() : null
      );
      const b = current?.banner;
      if (!b) throw new Error("load");
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placement: String(b.placement).toLowerCase(),
          eyebrow: b.eyebrow ?? "",
          title: b.title,
          subtitle: b.subtitle ?? "",
          image: b.image ?? "",
          link: b.link,
          linkLabel: b.linkLabel ?? "",
          sortOrder: b.sortOrder,
          active: !on,
        }),
      });
      if (!res.ok) throw new Error("save");
      setOn(!on);
      router.refresh();
    } catch {
      /* keep the previous visual state on failure */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={on}
      aria-label={on ? "Hide banner" : "Show banner"}
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
        on ? "bg-green-600" : "bg-stone-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

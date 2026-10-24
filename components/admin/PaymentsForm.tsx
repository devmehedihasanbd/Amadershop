"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, inputClass, labelClass, primaryBtnClass } from "./ui";
import type { CourierStatus, PayMethodStatus } from "@/lib/site-config";

export interface PaymentsInitial {
  toggles: Record<string, boolean>;
  secretsMeta: Record<string, { fromEnv: boolean; saved: boolean }>;
  methods: PayMethodStatus[];
  courier: CourierStatus;
}

interface SecretField {
  key: string;
  label: string;
  kind: "password" | "text" | "textarea";
  placeholder?: string;
}

const BKASH_FIELDS: SecretField[] = [
  { key: "pay_bkash_app_key", label: "App key", kind: "password" },
  { key: "pay_bkash_app_secret", label: "App secret", kind: "password" },
  { key: "pay_bkash_username", label: "Username", kind: "text" },
  { key: "pay_bkash_password", label: "Password", kind: "password" },
  { key: "pay_bkash_base_url", label: "Base URL", kind: "text", placeholder: "https://tokenized.sandbox.bka.sh" },
];

const NAGAD_FIELDS: SecretField[] = [
  { key: "pay_nagad_merchant_id", label: "Merchant ID", kind: "text" },
  { key: "pay_nagad_merchant_number", label: "Merchant number", kind: "text" },
  { key: "pay_nagad_public_key", label: "PG public key (PEM)", kind: "textarea" },
  { key: "pay_nagad_private_key", label: "Merchant private key (PEM)", kind: "textarea" },
  { key: "pay_nagad_base_url", label: "Base URL", kind: "text", placeholder: "http://sandbox.mynagad.com:10080" },
];

const STEADFAST_FIELDS: SecretField[] = [
  { key: "courier_steadfast_api_key", label: "API key", kind: "password" },
  { key: "courier_steadfast_secret_key", label: "Secret key", kind: "password" },
  { key: "courier_steadfast_base_url", label: "Base URL", kind: "text", placeholder: "https://portal.steadfast.com.bd" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-green-600" : "bg-stone-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SecretInput({
  field,
  meta,
  value,
  onChange,
  onClear,
  cleared,
}: {
  field: SecretField;
  meta: { fromEnv: boolean; saved: boolean };
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  cleared: boolean;
}) {
  const status = meta.fromEnv
    ? "Set via environment variable"
    : meta.saved && !cleared
      ? "Saved ✓"
      : cleared
        ? "Will be cleared on save"
        : "Not set";
  const inputCls =
    "w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 font-mono";
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className={labelClass} htmlFor={`pay-${field.key}`}>
          {field.label}
        </label>
        <span className="text-[11px] text-stone-400">{status}</span>
      </div>
      {field.kind === "textarea" ? (
        <textarea
          id={`pay-${field.key}`}
          rows={3}
          className={inputCls}
          placeholder={cleared ? "" : (field.placeholder ?? (meta.saved || meta.fromEnv ? "••••••••" : "Paste here"))}
          value={value}
          disabled={meta.fromEnv}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={`pay-${field.key}`}
          type={field.kind === "password" ? "password" : "text"}
          className={inputCls}
          placeholder={cleared ? "" : (field.placeholder ?? (meta.saved || meta.fromEnv ? "••••••••" : "Paste here"))}
          value={value}
          disabled={meta.fromEnv}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {meta.saved && !meta.fromEnv && !cleared && (
        <button
          type="button"
          onClick={onClear}
          className="mt-1 text-xs font-semibold text-red-600 hover:underline"
        >
          Clear saved value
        </button>
      )}
      {cleared && (
        <p className="mt-1 text-xs text-amber-600">
          The saved value will be removed when you save.
        </p>
      )}
    </div>
  );
}

export default function PaymentsForm({ initial }: { initial: PaymentsInitial }) {
  const router = useRouter();
  const [toggles, setToggles] = useState(initial.toggles);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [cleared, setCleared] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const metaOf = (key: string) =>
    initial.secretsMeta[key] ?? { fromEnv: false, saved: false };

  function secretPayload(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(secrets)) {
      if (v.trim() !== "") out[k] = v;
    }
    for (const k of cleared) {
      if (!(k in out)) out[k] = "";
    }
    return out;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggles, secrets: secretPayload() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const details = Array.isArray(json?.details) ? `: ${json.details.join(" ")}` : "";
        setError(`${json?.error ?? "Save failed."}${details}`);
        return;
      }
      setSaved(true);
      setSecrets({});
      setCleared(new Set());
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const methodById = new Map(initial.methods.map((m) => [m.id, m]));
  const methodRow = (
    id: string,
    toggleKey: string,
    hint: string
  ) => {
    const m = methodById.get(id as PayMethodStatus["id"]);
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3">
        <div>
          <p className="font-semibold text-stone-800">{m?.label ?? id}</p>
          <p className="text-xs text-stone-500">{hint}</p>
          {m && (
            <p className={`mt-0.5 text-xs font-semibold ${m.configured ? "text-green-700" : "text-amber-600"}`}>
              {m.configured ? "● Credentials ready" : "● Credentials missing"}
            </p>
          )}
        </div>
        <Toggle
          checked={toggles[toggleKey] ?? false}
          onChange={(v) => setToggles((t) => ({ ...t, [toggleKey]: v }))}
          label={`${m?.label ?? id} enabled`}
        />
      </div>
    );
  };

  const secretSection = (fields: SecretField[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className={f.kind === "textarea" ? "md:col-span-2" : ""}>
          <SecretInput
            field={f}
            meta={metaOf(f.key)}
            value={secrets[f.key] ?? ""}
            cleared={cleared.has(f.key)}
            onChange={(v) => {
              setSecrets((s) => ({ ...s, [f.key]: v }));
              setCleared((c) => {
                const n = new Set(c);
                n.delete(f.key);
                return n;
              });
            }}
            onClear={() =>
              setCleared((c) => {
                const n = new Set(c);
                n.add(f.key);
                return n;
              })
            }
          />
        </div>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved — the storefront updates immediately.
        </p>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold text-stone-900">Payment methods</h2>
        <p className="mt-1 text-sm text-stone-500">
          Only enabled methods appear at checkout. Online methods also need
          their credentials below before customers can use them.
        </p>
        <div className="mt-3 space-y-2">
          {methodRow("cod", "pay_cod_enabled", "Customer pays in cash on delivery.")}
          {methodRow("bkash", "pay_bkash_enabled", "bKash tokenized checkout.")}
          {methodRow("nagad", "pay_nagad_enabled", "Nagad PG checkout.")}
          {methodRow("rocket", "pay_rocket_enabled", "No public API — enable only for manual handling.")}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold text-stone-900">bKash credentials</h2>
        <p className="mt-1 text-sm text-stone-500">
          From the bKash merchant dashboard. Sandbox base URL:{" "}
          <code className="font-mono text-xs">https://tokenized.sandbox.bka.sh</code>
        </p>
        <div className="mt-3">{secretSection(BKASH_FIELDS)}</div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-bold text-stone-900">Nagad credentials</h2>
        <p className="mt-1 text-sm text-stone-500">
          From Nagad merchant onboarding (PG public key + your private key, PEM format).
        </p>
        <div className="mt-3">{secretSection(NAGAD_FIELDS)}</div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-stone-900">Steadfast courier</h2>
            <p className="mt-1 text-sm text-stone-500">
              {initial.courier.configured ? "● API keys ready" : "● API keys missing"} — used when booking deliveries from an order.
            </p>
          </div>
          <Toggle
            checked={toggles["courier_steadfast_enabled"] ?? false}
            onChange={(v) => setToggles((t) => ({ ...t, courier_steadfast_enabled: v }))}
            label="Steadfast enabled"
          />
        </div>
        <div className="mt-3">{secretSection(STEADFAST_FIELDS)}</div>
      </div>

      <p className="text-xs text-stone-400">
        Credentials set as environment variables on the server always override
        values saved here.
      </p>

      <button type="submit" disabled={loading} className={primaryBtnClass}>
        {loading ? "Saving…" : "Save payments & courier"}
      </button>
    </form>
  );
}

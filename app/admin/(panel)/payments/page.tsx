import { getDb } from "@/lib/db";
import { getSettingsMap } from "@/lib/settings";
import {
  MANAGED_SECRET_KEYS,
  MANAGED_TOGGLE_KEYS,
  getCourierStatus,
  getPaymentMethods,
} from "@/lib/site-config";
import PaymentsForm from "@/components/admin/PaymentsForm";
import { EmptyState, PageHeader } from "@/components/admin/ui";

const ENV_OF: Record<string, string> = {
  pay_bkash_app_key: "BKASH_APP_KEY",
  pay_bkash_app_secret: "BKASH_APP_SECRET",
  pay_bkash_username: "BKASH_USERNAME",
  pay_bkash_password: "BKASH_PASSWORD",
  pay_bkash_base_url: "BKASH_BASE_URL",
  pay_nagad_merchant_id: "NAGAD_MERCHANT_ID",
  pay_nagad_merchant_number: "NAGAD_MERCHANT_NUMBER",
  pay_nagad_public_key: "NAGAD_PUBLIC_KEY",
  pay_nagad_private_key: "NAGAD_PRIVATE_KEY",
  pay_nagad_base_url: "NAGAD_BASE_URL",
  courier_steadfast_api_key: "STEADFAST_API_KEY",
  courier_steadfast_secret_key: "STEADFAST_SECRET_KEY",
  courier_steadfast_base_url: "STEADFAST_BASE_URL",
};

export default async function AdminPaymentsPage() {
  const db = getDb();
  if (!db) {
    return <EmptyState message="Database not configured." />;
  }

  const map = await getSettingsMap();

  const toggles: Record<string, boolean> = {};
  for (const key of MANAGED_TOGGLE_KEYS) {
    toggles[key] = (map.get(key) ?? (key === "pay_cod_enabled" ? "1" : "0")) === "1";
  }

  const secretsMeta: Record<string, { fromEnv: boolean; saved: boolean }> = {};
  for (const key of MANAGED_SECRET_KEYS) {
    secretsMeta[key] = {
      fromEnv: Boolean(process.env[ENV_OF[key]]?.trim()),
      saved: Boolean(map.get(key)?.trim()),
    };
  }

  const [methods, courier] = await Promise.all([getPaymentMethods(), getCourierStatus()]);

  return (
    <div className="space-y-4">
      <PageHeader subtitle="Payment methods customers can use, gateway credentials, and courier booking." />
      <PaymentsForm initial={{ toggles, secretsMeta, methods, courier }} />
    </div>
  );
}

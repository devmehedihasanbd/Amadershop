import BannerForm, { type BannerFormData } from "@/components/admin/BannerForm";

const EMPTY: BannerFormData = {
  placement: "hero",
  eyebrow: "",
  title: "",
  subtitle: "",
  images: [],
  link: "/",
  linkLabel: "",
  sortOrder: "0",
  active: true,
};

export default function AdminBannerNewPage() {
  return (
    <div className="space-y-4">
      <BannerForm initial={EMPTY} />
    </div>
  );
}

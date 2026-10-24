import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import BottomTabBar from "@/components/BottomTabBar";

// Storefront layout — route group (store) is URL-transparent, so all
// public pages keep their existing URLs. This chrome renders ONLY for
// storefront routes; /admin/* never sees it.
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <AnnouncementBar />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      <BottomTabBar />
    </div>
  );
}

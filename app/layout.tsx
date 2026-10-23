import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import BottomTabBar from "@/components/BottomTabBar";

export const metadata: Metadata = {
  title: "Amader Shop — খাঁটি দেশি পণ্য, ঘরে বসে",
  description:
    "Amader Shop is an online grocery store for Bangladesh: raw honey, premium dates, fresh spices, pure oils and ghee, rice, lentils, nuts and organic specials — delivered to your door.",
  appleWebApp: {
    capable: true,
    title: "Amader Shop",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#166534",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-stone-800 antialiased md:pb-0">
        <CartProvider>
          <AnnouncementBar />
          <Header />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <CartDrawer />
          <BottomTabBar />
        </CartProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

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

// NOTE: this root layout intentionally renders NO storefront chrome.
// Storefront chrome (header, footer, tab bar, cart drawer) lives in
// app/(store)/layout.tsx so the admin panel (/admin/*) stays visually
// isolated like Shopify's admin.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-800 antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Script from "next/script";

import DeferredSiteExtras from "@/components/DeferredSiteExtras";
import NavigationGuard from "@/components/NavigationGuard";
import CouponPopupLazy from "@/components/coupon/CouponPopupLazy";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { DeliveryLocationProvider } from "@/contexts/DeliveryLocationContext";
import { GoldRatesProvider } from "@/contexts/GoldRatesContext";

import data from "@/data/contactDatas.json";
import { HOME_BACK_NAV_SCRIPT } from "@/lib/homeBackNavigation";

import "@/styles/cart.css";
import "@/styles/cart-page.css";
import "@/styles/header-search.css";
import "./globals.css";
import "@/styles/responsive.css";

const goldRatesRefreshMs =
  (data.heroSection.rates.refreshIntervalMinutes ?? 5) * 60 * 1000;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pradeep Jewellers | Modern Kolkata Fusion Gold & Silver",
  description:
    "Contemporary jewellery with Kolkata fusion design since 1983. Upload your design for a fast WhatsApp estimate — gold, diamond & silver. Suvarna Vriddhi savings plans.",
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning
      >
        <Script
          id="home-back-navigation"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: HOME_BACK_NAV_SCRIPT }}
        />
        <GoldRatesProvider refreshMs={goldRatesRefreshMs}>
          <CustomerAuthProvider>
            <DeliveryLocationProvider>
              <CartProvider>
              <NavigationGuard />
              <Header />

              <div
                className="app-root flex flex-1 flex-col min-h-0 w-full"
                suppressHydrationWarning
                key="app-root"
              >
                {children}
              </div>

              <Footer />
              <CouponPopupLazy />
              <DeferredSiteExtras />
              </CartProvider>
            </DeliveryLocationProvider>
          </CustomerAuthProvider>
        </GoldRatesProvider>
      </body>
    </html>
  );
}

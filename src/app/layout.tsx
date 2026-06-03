import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Script from "next/script";

import NavigationGuard from "@/components/NavigationGuard";
import TawkToChat from "@/components/TawkToChat";
import GoogleOneTapShell from "@/components/GoogleOneTapShell";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

import CheckoutFinalizeBridge from "@/components/CheckoutFinalizeBridge";
import { CartProvider } from "@/contexts/CartContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
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
  title: "Pradeep Jewellers | Custom Gold, Diamond & Silver — Nadiad",
  description:
    "Custom jewellery made in Nadiad. Upload your design and get a fast estimate on WhatsApp. Gold, diamond & silver. Suvarna Vriddhi savings plans.",
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
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: HOME_BACK_NAV_SCRIPT }}
        />
        <GoldRatesProvider refreshMs={goldRatesRefreshMs}>
          <CustomerAuthProvider>
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
              <GoogleOneTapShell />
              <TawkToChat />
            </CartProvider>
          </CustomerAuthProvider>
        </GoldRatesProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";

import SchemeScrollToHash from "@/components/scheme/SchemeScrollToHash";
import { SchemeContentProvider } from "@/contexts/SchemeContentContext";

import "@/components/scheme/css/landingPage.css";
import "@/components/scheme/css/legalPage.css";

export const metadata: Metadata = {
  title: "Suvarna Vriddhi Yojna | Pradeep Jewellers",
  description:
    "Gold savings scheme at Pradeep Jewellers — 12+1, 18+2, and 24+3 plans with calculator and enquiry.",
};

export default function SchemeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SchemeContentProvider>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        rel="stylesheet"
      />
      <SchemeScrollToHash />
      {children}
    </SchemeContentProvider>
  );
}

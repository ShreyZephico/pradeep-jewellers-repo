import type { Metadata } from "next";
import { cookies } from "next/headers";

import SchemeScrollToHash from "@/components/scheme/SchemeScrollToHash";
import { SchemeContentProvider } from "@/contexts/SchemeContentContext";
import {
  parseSchemeLang,
  SCHEME_LANG_COOKIE,
  SCHEME_LANG_DEFAULT,
} from "@/lib/scheme/schemeLang";

import "@/components/scheme/css/landingPage.css";
import "@/components/scheme/css/legalPage.css";

export const metadata: Metadata = {
  title: "Suvarna Vriddhi Yojna | Pradeep Jewellers",
  description:
    "Gold savings scheme at Pradeep Jewellers — 12+1, 18+2, and 24+3 plans with calculator and enquiry.",
};

export default async function SchemeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLang =
    parseSchemeLang(cookieStore.get(SCHEME_LANG_COOKIE)?.value) ??
    SCHEME_LANG_DEFAULT;

  return (
    <SchemeContentProvider initialLang={initialLang}>
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

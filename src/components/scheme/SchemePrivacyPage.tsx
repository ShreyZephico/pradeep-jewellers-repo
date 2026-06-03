"use client";

import { useEffect } from "react";

import LegalDocument from "@/components/scheme/LegalDocument";
import SchemePageShell from "@/components/scheme/SchemePageShell";
import { SmartLink } from "@/components/scheme/shared";
import { useSchemeContent } from "@/contexts/SchemeContentContext";

export default function SchemePrivacyPage() {
  const { content } = useSchemeContent();
  const doc = content.legal?.privacy;

  useEffect(() => {
    if (!doc?.browserTitle) return;
    const prev = document.title;
    document.title = `${doc.browserTitle} · ${content.meta.brandName}`;
    return () => {
      document.title = prev;
    };
  }, [doc?.browserTitle, content.meta.brandName]);

  if (!doc) return null;

  return (
    <SchemePageShell>
      <div className="svy__legalPageWrap">
        <nav
          className="svy__legalBreadcrumb"
          aria-label={doc.breadcrumb.ariaLabel}
        >
          <SmartLink href="/scheme">{doc.breadcrumb.home}</SmartLink>
          <span aria-hidden="true"> · </span>
          <span>{doc.breadcrumb.current}</span>
        </nav>
        <LegalDocument doc={doc} />
      </div>
    </SchemePageShell>
  );
}

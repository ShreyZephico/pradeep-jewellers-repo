"use client";

import EnquiryForm from "@/components/scheme/EnquiryForm";
import SchemePageShell from "@/components/scheme/SchemePageShell";
import { useSchemeContent } from "@/contexts/SchemeContentContext";

export default function SchemeEnquiryPage() {
  const { content } = useSchemeContent();

  return (
    <SchemePageShell>
      <EnquiryForm enquiry={content.enquiry} />
    </SchemePageShell>
  );
}

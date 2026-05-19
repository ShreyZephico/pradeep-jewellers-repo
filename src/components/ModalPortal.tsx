"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalChromeInsets } from "@/hooks/useModalChromeInsets";

type ModalPortalProps = {
  children: ReactNode;
};

export default function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalChromeInsets(mounted);

  if (!mounted) {
    return null;
  }

  return createPortal(children, document.body);
}

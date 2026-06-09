"use client";

import { useCallback, useEffect, useState } from "react";

export type SchemeSnackbarState = {
  type: "success" | "error";
  text: string;
} | null;

export function useSchemeSnackbar() {
  const [snackbar, setSnackbar] = useState<SchemeSnackbarState>(null);
  const [visible, setVisible] = useState(false);

  const showSnackbar = useCallback((type: "success" | "error", text: string) => {
    setSnackbar({ type, text });
    setVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  useEffect(() => {
    if (!snackbar) return;
    const hideTimer = window.setTimeout(() => setVisible(false), 4000);
    const clearTimer = window.setTimeout(() => setSnackbar(null), 4400);
    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [snackbar]);

  return { snackbar, snackbarVisible: visible, showSnackbar };
}

export default function SchemeSnackbar({
  snackbar,
  visible,
}: {
  snackbar: SchemeSnackbarState;
  visible: boolean;
}) {
  if (!snackbar) return null;

  return (
    <div
      className={`svy__snackbar svy__snackbar--${snackbar.type}${
        visible ? " svy__snackbar--visible" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      {snackbar.text}
    </div>
  );
}

"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { schemeHref } from "@/lib/scheme/schemeHref";

export function MaterialIcon({
  name,
  className,
  ...props
}: {
  name: string;
  className?: string;
} & ComponentProps<"span">) {
  return (
    <span
      className={["material-symbols-outlined", className].filter(Boolean).join(" ")}
      {...props}
    >
      {name}
    </span>
  );
}

export function SmartLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const isExternal = /^https?:\/\//i.test(href);
  const isHash = href.startsWith("#");

  if (isHash) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  if (isExternal) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link className={className} href={schemeHref(href)}>
      {children}
    </Link>
  );
}

"use client";

import Link from "next/link";

import {
  displayName,
  initials,
  type AccountSection,
  type CustomerProfile,
} from "@/components/profile/profileShared";

import "@/styles/profile.css";

type AccountShellProps = {
  active: AccountSection;
  pageTitle: string;
  pageSubtitle: string;
  breadcrumbLabel: string;
  profile: CustomerProfile | null;
  loading?: boolean;
  children: React.ReactNode;
};

function AccountNav({ active }: { active: AccountSection }) {
  return (
    <nav className="profile-page__nav" aria-label="Account sections">
      <Link
        href="/profile"
        className={`profile-page__nav-link${active === "profile" ? " is-active" : ""}`}
      >
        Personal details
      </Link>
      <Link
        href="/profile/addresses"
        className={`profile-page__nav-link${active === "addresses" ? " is-active" : ""}`}
      >
        Addresses
      </Link>
      <Link
        href="/orders"
        className={`profile-page__nav-link${active === "orders" ? " is-active" : ""}`}
      >
        My orders
      </Link>
    </nav>
  );
}

function LoadingSkeleton() {
  return (
    <div className="profile-loading">
      <div className="profile-skeleton profile-skeleton--card" />
    </div>
  );
}

export default function AccountShell({
  active,
  pageTitle,
  pageSubtitle,
  breadcrumbLabel,
  profile,
  loading = false,
  children,
}: AccountShellProps) {
  const name = displayName(profile);

  return (
    <div className="profile-page">
      <div className="profile-page__breadcrumb-bar">
        <nav className="profile-page__breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{breadcrumbLabel}</span>
        </nav>
      </div>

      <div className="profile-page__container profile-page__main">
        <header className="profile-page__header">
          <div className="profile-page__avatar" aria-hidden>
            {initials(name)}
          </div>
          <div>
            <h1 className="profile-page__title">{pageTitle}</h1>
            <p className="profile-page__subtitle">{pageSubtitle}</p>
          </div>
        </header>

        <div className="profile-page__layout">
          <AccountNav active={active} />
          <div className="profile-page__content">
            {loading ? <LoadingSkeleton /> : children}
          </div>
        </div>
      </div>
    </div>
  );
}

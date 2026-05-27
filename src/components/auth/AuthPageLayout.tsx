import Link from 'next/link';

import LoginJewelleryBackground from '@/components/auth/LoginJewelleryBackground';
import AuthRouteChrome from '@/components/auth/AuthRouteChrome';

type AuthPageLayoutProps = {
  children: React.ReactNode;
  wide?: boolean;
  /** Tighter layout for multi-field signup — fits one screen */
  compact?: boolean;
};

export default function AuthPageLayout({
  children,
  wide = false,
  compact = false,
}: AuthPageLayoutProps) {
  const pageClass = [
    'login-page',
    compact ? 'login-page--signup-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <AuthRouteChrome />
      <div className={pageClass}>
        <LoginJewelleryBackground />
        <div className="login-page__aurora" aria-hidden />
        <div className="login-page__grid" aria-hidden />

        <div
          className={`login-page__inner${wide ? ' login-page__inner--wide' : ''}`}
        >
          {children}

          <Link href="/" className="login-page__home-link">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path
                d="M15 18l-6-6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </>
  );
}

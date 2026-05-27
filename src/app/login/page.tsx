'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { notifyAuthChanged } from '@/contexts/CustomerAuthContext';
import {
  consumeReturnPath,
  getReturnPathFromSearch,
  saveReturnPath,
} from '@/lib/authRedirect';

import '@/styles/login.css';

function completeLogin(router: ReturnType<typeof useRouter>) {
  notifyAuthChanged();
  router.replace(consumeReturnPath());
  router.refresh();
}

function EmailIcon() {
  return (
    <svg
      className="login-card__input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 6h16v12H4z" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="login-card__input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const returnToParam = searchParams.get('returnTo');

  useEffect(() => {
    const returnTo = getReturnPathFromSearch(searchParams);
    if (returnTo) {
      saveReturnPath(returnTo);
    }

    fetch('/api/auth/check', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.isAuthenticated) {
          completeLogin(router);
        }
      })
      .catch(() => null);
  }, [router, returnToParam]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('customerEmail', data.email ?? email);
      localStorage.setItem('loginMethod', data.loginMethod ?? 'email');
      completeLogin(router);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('');
    setGoogleLoading(true);

    const width = 500;
    const height = 620;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    const popup = window.open(
      '/api/auth/google?mode=login',
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      setGoogleLoading(false);
      setError('Please allow popups to continue with Google.');
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data.type === 'GOOGLE_LOGIN_SUCCESS' ||
        event.data.type === 'GOOGLE_SIGNUP_SUCCESS'
      ) {
        localStorage.setItem('customerEmail', event.data.email);
        localStorage.setItem('loginMethod', 'google');
        setGoogleLoading(false);
        window.removeEventListener('message', messageHandler);
        completeLogin(router);
        return;
      }

      if (event.data.type === 'GOOGLE_LOGIN_ERROR') {
        setGoogleLoading(false);
        setError(event.data.error || 'Google login failed');
        window.removeEventListener('message', messageHandler);
      }
    };

    window.addEventListener('message', messageHandler);
  };

  return (
    <article className="login-card">
      <span className="login-card__badge">
        <span className="login-card__badge-row">
          <span className="login-card__badge-line" aria-hidden />
          Sign in
          <span className="login-card__badge-line" aria-hidden />
        </span>
      </span>

      <header className="login-card__header">
        <h1 className="login-card__title">Welcome back</h1>
        <p className="login-card__subtitle">
          Sign in to explore curated collections and exclusive offers.
        </p>
      </header>

      {error ? (
        <div className="login-card__error" role="alert">
          {error}
        </div>
      ) : null}

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        type="button"
        className="login-card__google"
      >
        <svg className="login-card__google-icon" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
      </button>

      <div className="login-card__divider">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit} className="login-card__form">
        <div className="login-card__field">
          <label className="login-card__label" htmlFor="login-email">
            Email address
          </label>
          <div className="login-card__input-wrap">
            <EmailIcon />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="login-card__input"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="login-card__field">
          <label className="login-card__label" htmlFor="login-password">
            Password
          </label>
          <div className="login-card__input-wrap">
            <LockIcon />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="login-card__input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="login-card__submit"
        >
          {loading ? (
            <>
              <span className="login-card__submit-spinner" aria-hidden />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="login-card__footer">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="login-card__link"
          onClick={() => saveReturnPath()}
        >
          Create one
        </Link>
      </p>
    </article>
  );
}

export default function LoginPage() {
  return (
    <AuthPageLayout>
      <Suspense fallback={<div className="login-page__loading" />}>
        <LoginForm />
      </Suspense>
    </AuthPageLayout>
  );
}

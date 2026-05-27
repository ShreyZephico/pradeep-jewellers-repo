'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import AuthPageLayout from '@/components/auth/AuthPageLayout';
import { notifyAuthChanged } from '@/contexts/CustomerAuthContext';
import {
  consumeReturnPath,
  getReturnPathFromSearch,
  saveReturnPath,
} from '@/lib/authRedirect';

import '@/styles/login.css';
import '@/styles/signup.css';

function completeSignup(router: ReturnType<typeof useRouter>) {
  notifyAuthChanged();
  router.replace(consumeReturnPath());
  router.refresh();
}

function UserIcon() {
  return (
    <svg
      className="login-card__input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" strokeLinecap="round" />
    </svg>
  );
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

function PhoneIcon() {
  return (
    <svg
      className="login-card__input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M8 4h2l1.2 3.2-1.4 1a12 12 0 0 0 5.2 5.2l1-1.4L19 13v2a2 2 0 0 1-2 2h-.5A11.5 11.5 0 0 1 6 6.5V6a2 2 0 0 1 2-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function OtpIcon() {
  return (
    <svg
      className="login-card__input-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" />
    </svg>
  );
}

function GoogleIcon() {
  return (
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
  );
}

function AuthBadge({ label }: { label: string }) {
  return (
    <span className="login-card__badge">
      <span className="login-card__badge-row">
        <span className="login-card__badge-line" aria-hidden />
        {label}
        <span className="login-card__badge-line" aria-hidden />
      </span>
    </span>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const returnTo = getReturnPathFromSearch(
      new URLSearchParams(window.location.search)
    );
    if (returnTo) {
      saveReturnPath(returnTo);
    }

    fetch('/api/auth/check', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.isAuthenticated) {
          completeSignup(router);
        }
      })
      .catch(() => null);
  }, [router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (
        event.data.type === 'GOOGLE_SIGNUP_SUCCESS' ||
        event.data.type === 'GOOGLE_LOGIN_SUCCESS'
      ) {
        localStorage.setItem('customerEmail', event.data.email);
        localStorage.setItem('loginMethod', 'google');
        setMessage(
          event.data.isNewUser
            ? 'Account created successfully!'
            : 'Welcome back! Redirecting…'
        );
        setGoogleLoading(false);
        setTimeout(() => {
          completeSignup(router);
        }, 1000);
      } else if (
        event.data.type === 'GOOGLE_SIGNUP_ERROR' ||
        event.data.type === 'GOOGLE_LOGIN_ERROR'
      ) {
        setError(event.data.error || 'Google sign up failed');
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, [router]);

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    if (digits.length > 10) {
      digits = digits.slice(0, 10);
    }

    if (digits.length > 0) {
      setPhone(`+91${digits}`);
    } else {
      setPhone('');
    }
  };

  const sendOTP = async () => {
    setError('');
    setMessage('');

    if (!phone || phone.length < 12) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\s/g, '');

      const checkResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: cleanPhone }),
      });

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setError(
          'An account already exists with this email or phone. Please sign in instead.'
        );
        setLoading(false);
        return;
      }

      const otpResponse = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok && otpData.success) {
        setStep('otp');
        setMessage('OTP sent to your phone!');
        setResendTimer(60);
      } else {
        setError(otpData.error || otpData.message || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPAndSignup = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const verifyResponse = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error);
        setLoading(false);
        return;
      }

      const cleanPhone = phone.replace(/\s/g, '');
      const signupResponse = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: cleanPhone, password }),
      });

      const signupData = await signupResponse.json();

      if (signupResponse.ok) {
        localStorage.setItem('customerEmail', signupData.email ?? email);
        localStorage.setItem('loginMethod', signupData.loginMethod ?? 'email');
        setMessage('Account created successfully! Redirecting…');
        setTimeout(() => {
          completeSignup(router);
        }, 700);
      } else {
        setError(signupData.error || 'Signup failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setGoogleLoading(true);
    setError('');
    setMessage('');

    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;

    window.open(
      '/api/auth/google?mode=signup',
      'Google Signup',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  if (step === 'otp') {
    return (
      <AuthPageLayout wide compact>
        <div className="signup-page">
          <article className="login-card">
            <AuthBadge label="Verify" />

            <header className="login-card__header">
              <h1 className="login-card__title">Verify your number</h1>
              <p className="login-card__subtitle">
                Enter the 6-digit code we sent to your mobile.
              </p>
            </header>

            {message ? (
              <div className="login-card__success" role="status">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="login-card__error" role="alert">
                {error}
              </div>
            ) : null}

            <p className="login-card__note">
              Code sent to <strong>{phone}</strong>
            </p>

            <div className="login-card__field">
              <label className="login-card__label" htmlFor="signup-otp">
                OTP code
              </label>
              <div className="login-card__input-wrap">
                <OtpIcon />
                <input
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  maxLength={6}
                  className="login-card__input login-card__input--otp"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="login-card__actions">
              <button
                type="button"
                onClick={verifyOTPAndSignup}
                disabled={loading}
                className="login-card__submit"
              >
                {loading ? (
                  <>
                    <span className="login-card__submit-spinner" aria-hidden />
                    Creating account…
                  </>
                ) : (
                  'Verify & create account'
                )}
              </button>

              <button
                type="button"
                onClick={sendOTP}
                disabled={resendTimer > 0 || loading}
                className="login-card__btn-text"
              >
                {resendTimer > 0
                  ? `Resend OTP in ${resendTimer}s`
                  : 'Resend OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtp('');
                  setError('');
                  setMessage('');
                }}
                className="login-card__btn-text login-card__btn-text--muted"
              >
                ← Back to signup
              </button>
            </div>

            <p className="login-card__footer">
              Already have an account?{' '}
              <Link href="/login" className="login-card__link">
                Sign in
              </Link>
            </p>
          </article>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout wide compact>
      <div className="signup-page">
        <article className="login-card">
          <AuthBadge label="Join us" />

          <header className="login-card__header">
            <h1 className="login-card__title">Create your account</h1>
            <p className="login-card__subtitle">
              Timeless jewellery, personalised for you.
            </p>
          </header>

          {message ? (
            <div className="login-card__success" role="status">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="login-card__error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            type="button"
            className="login-card__google"
          >
            <GoogleIcon />
            {googleLoading ? 'Connecting to Google…' : 'Sign up with Google'}
          </button>

          <div className="login-card__divider">
            <span>or</span>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendOTP();
            }}
            className="login-card__form login-card__form--compact login-card__form--grid"
          >
            <div className="login-card__field">
              <label className="login-card__label" htmlFor="signup-name">
                Full name
              </label>
              <div className="login-card__input-wrap">
                <UserIcon />
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="login-card__input"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="login-card__field">
              <label className="login-card__label" htmlFor="signup-email">
                Email address
              </label>
              <div className="login-card__input-wrap">
                <EmailIcon />
                <input
                  id="signup-email"
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

            <div className="login-card__field login-card__field--full">
              <label className="login-card__label" htmlFor="signup-phone">
                Phone number
              </label>
              <div className="login-card__input-wrap">
                <PhoneIcon />
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  className="login-card__input"
                  placeholder="9876543210"
                  autoComplete="tel"
                />
              </div>
              <p className="login-card__hint">
                Enter a 10-digit Indian number (+91 added automatically)
              </p>
            </div>

            <div className="login-card__field login-card__field--full">
              <label className="login-card__label" htmlFor="signup-password">
                Password
              </label>
              <div className="login-card__input-wrap">
                <LockIcon />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="login-card__input"
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-card__submit login-card__field--full"
            >
              {loading ? (
                <>
                  <span className="login-card__submit-spinner" aria-hidden />
                  Checking…
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>

          <p className="login-card__footer">
            Already have an account?{' '}
            <Link
              href="/login"
              className="login-card__link"
              onClick={() => saveReturnPath()}
            >
              Sign in
            </Link>
          </p>
        </article>
      </div>
    </AuthPageLayout>
  );
}

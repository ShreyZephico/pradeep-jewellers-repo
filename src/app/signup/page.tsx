'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  // Check if already logged in
  useEffect(() => {
    fetch('/api/auth/check')
      .then((response) => response.json())
      .then((data) => {
        if (data.isAuthenticated) {
          router.push('/');
        }
      })
      .catch(() => null);
  }, [router]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Listen for Google signup/login messages
  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'GOOGLE_SIGNUP_SUCCESS' || event.data.type === 'GOOGLE_LOGIN_SUCCESS') {
        localStorage.setItem('customerEmail', event.data.email);
        localStorage.setItem('loginMethod', 'google');
        
        setMessage(`✅ ${event.data.isNewUser ? 'Account created!' : 'Login successful!'} Welcome ${event.data.name}!`);
        setGoogleLoading(false);
        
        setTimeout(() => {
          router.push('/');
        }, 1000);
        
      } else if (event.data.type === 'GOOGLE_SIGNUP_ERROR' || event.data.type === 'GOOGLE_LOGIN_ERROR') {
        setError('❌ ' + event.data.error);
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleGoogleMessage);
    return () => window.removeEventListener('message', handleGoogleMessage);
  }, [router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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

  // ✅ FIXED: Properly check if user exists before sending OTP
  const sendOTP = async () => {
    // Clear previous errors
    setError('');
    setMessage('');
    
    // Validate phone
    if (!phone || phone.length < 12) {
      setError('Please enter a valid phone number');
      return;
    }

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Validate name
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      
      // ✅ Step 1: Check if user already exists
      console.log('🔍 Checking if user exists...');
      const checkResponse = await fetch('/api/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: cleanPhone })
      });
      
      const checkData = await checkResponse.json();
      console.log('Check response:', checkData);
      
      // ✅ If user exists, show error and STOP
      if (checkData.exists) {
        setError('❌ User already exists with this email or phone. Please login instead.');
        setLoading(false);
        return; // ❌ STOP HERE - Don't send OTP
      }
      
      // ✅ Step 2: User doesn't exist, send OTP
      console.log('✅ User does not exist, sending OTP...');
      const otpResponse = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const otpData = await otpResponse.json();

      if (otpResponse.ok && otpData.success) {
        setStep('otp');
        setMessage('OTP sent to your phone!');
        setResendTimer(60);
        if (otpData.debug?.otp) {
          console.log('📱 Test OTP:', otpData.debug.otp);
        }
      } else {
        setError(otpData.error || otpData.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Error:', err);
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
      // Verify OTP
      const verifyResponse = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error);
        setLoading(false);
        return;
      }

      // Create account in Shopify
      const cleanPhone = phone.replace(/\s/g, '');
      const signupResponse = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: cleanPhone, password })
      });

      const signupData = await signupResponse.json();

      if (signupResponse.ok) {
        localStorage.setItem('customerEmail', signupData.email ?? email);
        localStorage.setItem('loginMethod', signupData.loginMethod ?? 'email');
        setMessage('✅ Account created successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/');
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

  // OTP Verification Step
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-6 text-black">Verify OTP</h2>
          
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-4 text-black">
            Enter the 6-digit OTP sent to <strong>{phone}</strong>
          </p>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl text-black"
              placeholder="000000"
            />
          </div>

          <button
            onClick={verifyOTPAndSignup}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 mb-3"
          >
            {loading ? 'Verifying & Creating Account...' : 'Verify & Create Account'}
          </button>

          <button
            onClick={sendOTP}
            disabled={resendTimer > 0}
            className="w-full text-blue-600 hover:text-blue-700 text-sm disabled:opacity-50"
          >
            {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
          </button>

          <button
            onClick={() => setStep('form')}
            className="w-full text-gray-500 hover:text-gray-700 text-sm mt-3"
          >
            ← Back to signup
          </button>
        </div>
      </div>
    );
  }

  // Signup Form Step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-black">Create Account</h2>
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Google Signup Button */}
        <button
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition mb-4 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {/* Regular Signup Form */}
        <form onSubmit={(e) => { e.preventDefault(); sendOTP(); }}>
          <div className="mb-4">
            <label className="block text-black font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="John Doe"
            />
          </div>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-black font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="9876543210"
            />
            <p className="text-xs text-gray-500 mt-1">Enter 10-digit number (will auto-add +91)</p>
          </div>

          <div className="mb-6">
            <label className="block text-black font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Send OTP'}
          </button>
        </form>

        {/* Already have an account? link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

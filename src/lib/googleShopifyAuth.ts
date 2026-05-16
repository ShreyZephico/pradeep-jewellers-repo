import { NextResponse } from 'next/server';
import {
  createCustomer,
  createCustomerTokenWithPasswords,
  findCustomerByEmailOrPhone,
  googleCustomerPassword,
  legacyGoogleCustomerPasswords,
  splitCustomerName,
  updateCustomerPassword,
} from '@/lib/shopifyCustomer';

type GoogleProfile = {
  email?: string;
  name?: string;
};

type GoogleAuthMode = 'login' | 'signup';

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function successHtml(message: Record<string, unknown>, title: string) {
  const safeTitle = htmlEscape(title);

  return `<!DOCTYPE html>
<html>
  <head>
    <title>Google Login</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; background: #f7fafc; color: #1f2937; }
      .panel { width: min(360px, calc(100vw - 32px)); border: 1px solid #e5e7eb; border-radius: 16px; background: white; padding: 28px; text-align: center; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
      .mark { margin: 0 auto 14px; display: grid; height: 44px; width: 44px; place-items: center; border-radius: 999px; background: #dcfce7; color: #15803d; font-size: 24px; font-weight: 800; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 0; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="panel">
      <div class="mark">✓</div>
      <h1>${safeTitle}</h1>
      <p>Taking you to your account...</p>
    </div>
    <script>
      const message = ${JSON.stringify(message)};
      if (window.opener) {
        window.opener.postMessage(message, window.location.origin);
        setTimeout(() => window.close(), 700);
      } else {
        window.location.href = '/';
      }
    </script>
  </body>
</html>`;
}

function getGoogleAuthMode(value: string | null): GoogleAuthMode {
  return value === 'signup' ? 'signup' : 'login';
}

async function linkExistingCustomerToGoogle(customerId: string, email: string, password: string) {
  try {
    await updateCustomerPassword(customerId, password);
  } catch (error) {
    console.error('Unable to update Shopify customer password for Google login:', error);
    return null;
  }

  const linkedTokenResult = await createCustomerTokenWithPasswords(email, [password]);

  if ('accessToken' in linkedTokenResult) {
    return linkedTokenResult;
  }

  return null;
}

function errorHtml(errorMessage: string, mode: GoogleAuthMode = 'login') {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Google Login Error</title>
    <style>
      body { font-family: system-ui, sans-serif; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; background: #f7fafc; color: #1f2937; }
      .panel { width: min(380px, calc(100vw - 32px)); border: 1px solid #fecaca; border-radius: 16px; background: white; padding: 28px; text-align: center; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12); }
      .mark { margin: 0 auto 14px; display: grid; height: 44px; width: 44px; place-items: center; border-radius: 999px; background: #fee2e2; color: #dc2626; font-size: 24px; font-weight: 800; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 0; color: #6b7280; }
      button { margin-top: 18px; border: 0; border-radius: 10px; background: #2563eb; color: white; padding: 10px 16px; cursor: pointer; }
    </style>
  </head>
  <body>
    <div class="panel">
      <div class="mark">!</div>
      <h1>Google login failed</h1>
      <p>${htmlEscape(errorMessage)}</p>
      <button onclick="window.close()">Close</button>
    </div>
    <script>
      const message = ${JSON.stringify({
        type: mode === 'signup' ? 'GOOGLE_SIGNUP_ERROR' : 'GOOGLE_LOGIN_ERROR',
        error: errorMessage,
      })};
      if (window.opener) {
        window.opener.postMessage(message, window.location.origin);
      }
    </script>
  </body>
</html>`;
}

export async function handleGoogleShopifyAuth(request: Request, redirectUri: string) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const mode = getGoogleAuthMode(code ? url.searchParams.get('state') : url.searchParams.get('mode'));

  if (oauthError) {
    return new NextResponse(errorHtml('Google authentication was cancelled or failed.', mode), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }

  if (!code) {
    const authUrl =
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: requiredEnv('GOOGLE_CLIENT_ID'),
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'online',
        prompt: 'select_account',
        state: mode,
      });

    return NextResponse.redirect(authUrl);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: requiredEnv('GOOGLE_CLIENT_ID'),
        client_secret: requiredEnv('GOOGLE_CLIENT_SECRET'),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Could not verify Google login.');
    }

    const tokens = await tokenResponse.json();
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      throw new Error('Could not read Google profile.');
    }

    const profile = (await profileResponse.json()) as GoogleProfile;

    if (!profile.email) {
      throw new Error('Google did not return an email address.');
    }

    const email = profile.email.trim().toLowerCase();
    const name = profile.name || email.split('@')[0];
    const password = googleCustomerPassword(email);
    const existingCustomer = await findCustomerByEmailOrPhone(email);

    if (mode === 'signup' && existingCustomer) {
      throw new Error('Email already exists. Please login with Google instead.');
    }

    const tokenAttempt = await createCustomerTokenWithPasswords(email, [
      password,
      ...legacyGoogleCustomerPasswords(email),
    ]);
    let customerAccessToken =
      'accessToken' in tokenAttempt ? tokenAttempt : null;
    let isNewUser = false;

    if (!customerAccessToken) {
      if (existingCustomer) {
        customerAccessToken = await linkExistingCustomerToGoogle(
          existingCustomer.id,
          email,
          password
        );

        if (!customerAccessToken && mode === 'login') {
          throw new Error('Could not create a Shopify customer session for Google login.');
        }
      }
    }

    if (!customerAccessToken) {
      const { firstName, lastName } = splitCustomerName(name);
      const createResult = await createCustomer({
        email,
        password,
        firstName,
        ...(lastName ? { lastName } : {}),
        acceptsMarketing: false,
      });
      const createError = createResult.customerUserErrors[0];

      if (createError?.code === 'TAKEN') {
        const takenCustomer = existingCustomer ?? (await findCustomerByEmailOrPhone(email));

        if (!takenCustomer) {
          throw new Error('An account already exists with this email. Please sign in with your password.');
        }

        customerAccessToken = await linkExistingCustomerToGoogle(
          takenCustomer.id,
          email,
          password
        );

        if (!customerAccessToken && mode === 'login') {
          throw new Error('Could not create a Shopify customer session for Google login.');
        }

        isNewUser = false;
      } else if (createError) {
        throw new Error(createError.message);
      }

      if (!customerAccessToken && !createError) {
        const newTokenResult = await createCustomerTokenWithPasswords(email, [password]);
        customerAccessToken = 'accessToken' in newTokenResult ? newTokenResult : null;
        isNewUser = true;
      }
    }

    if (!customerAccessToken) {
      throw new Error('Could not create a Shopify login session.');
    }

    const response = new NextResponse(
      successHtml(
        {
          type: isNewUser ? 'GOOGLE_SIGNUP_SUCCESS' : 'GOOGLE_LOGIN_SUCCESS',
          email,
          name,
          isNewUser,
        },
        isNewUser ? 'Account created' : 'Login successful'
      ),
      { headers: { 'Content-Type': 'text/html' } }
    );
    const expires = new Date(customerAccessToken.expiresAt);

    response.cookies.set('customerAccessToken', customerAccessToken.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });
    response.cookies.set('customerEmail', email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });
    response.cookies.set('loginMethod', 'google', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    if (name?.trim()) {
      response.cookies.set('customerName', name.trim(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Google Shopify auth error:', error);
    return new NextResponse(errorHtml((error as Error).message, mode), {
      headers: { 'Content-Type': 'text/html' },
      status: 400,
    });
  }
}

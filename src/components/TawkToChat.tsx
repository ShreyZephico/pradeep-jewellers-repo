'use client';

import Script from 'next/script';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import LiveChatLauncher from '@/components/LiveChatLauncher';
import { getTawkEmbedConfig } from '@/lib/tawkConfig';

const TAWK_EMBED = getTawkEmbedConfig();

type VisitorProfile = {
  name: string;
  email?: string;
  phone: string;
  isAuthenticated?: boolean;
};

type TawkApi = {
  onLoad?: () => void;
  onChatMaximized?: () => void;
  onChatMinimized?: () => void;
  onChatHidden?: () => void;
  setAttributes?: (
    attributes: Record<string, string>,
    callback?: (error?: unknown) => void
  ) => void;
  addEvent?: (
    event: string,
    metadata?: Record<string, string>,
    callback?: (error?: unknown) => void
  ) => void;
  minimize?: () => void;
  maximize?: () => void;
  hideWidget?: () => void;
  showWidget?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
    Tawk_LoadStart?: Date;
  }
}

const TAWK_PROFILE_STORAGE_KEY = 'tawkVisitorProfile';
const TAWK_LAUNCHER_COLLAPSED_KEY = 'tawkLauncherCollapsed';

type ChatFormErrors = {
  name?: string;
  phone?: string;
};

/** Valid 10-digit Indian mobile → E.164 (+91…). */
function normalizeIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, '');

  let national = '';
  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  } else {
    return null;
  }

  if (!/^[6-9]\d{9}$/.test(national)) {
    return null;
  }

  return `+91${national}`;
}

function validateChatForm(
  name: string,
  phone: string,
  requireName: boolean
): { errors: ChatFormErrors; phone: string | null } {
  const errors: ChatFormErrors = {};
  const trimmedName = name.trim();

  if (requireName && trimmedName.length < 2) {
    errors.name = 'Please enter your name.';
  }

  if (!phone.trim()) {
    errors.phone = 'Please enter your mobile number.';
    return { errors, phone: null };
  }

  const normalized = normalizeIndianMobile(phone);
  if (!normalized) {
    errors.phone =
      'Enter a valid 10-digit Indian mobile number (e.g. 98765 43210).';
    return { errors, phone: null };
  }

  return { errors, phone: normalized };
}

function getStoredGuestProfile(): VisitorProfile | null {
  try {
    const profile = localStorage.getItem(TAWK_PROFILE_STORAGE_KEY);

    return profile ? (JSON.parse(profile) as VisitorProfile) : null;
  } catch {
    return null;
  }
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function tawkAttributesForProfile(profile: VisitorProfile) {
  const emailRaw = profile.email?.trim();
  const email = emailRaw ? safeDecode(emailRaw) : undefined;

  const hasValidEmail = Boolean(
    email &&
      // Basic sanity check; Tawk rejects malformed values (including URL-encoded).
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );

  return {
    name: profile.name,
    ...(hasValidEmail ? { email } : {}),
    phone: profile.phone,
    mobile: profile.phone,
    'phone-number': profile.phone,
  };
}

export default function TawkToChat() {
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ChatFormErrors>({});
  const shouldOpenAfterProfile = useRef(false);
  const hasLoadedProfile = useRef(false);
  const profileRef = useRef<VisitorProfile | null>(null);
  const needsProfileRef = useRef(false);
  const [launcherCollapsed, setLauncherCollapsed] = useState(false);
  const [launcherHydrated, setLauncherHydrated] = useState(false);
  const launcherCollapsedRef = useRef(false);
  const tawkReadyRef = useRef(false);
  const tawkConfiguredRef = useRef(false);
  const openChatAttemptRef = useRef(false);
  const pendingChatOpenRef = useRef(false);
  const [chatOpen, setChatOpen] = useState(false);

  const setTawkChatOpen = useCallback((open: boolean) => {
    setChatOpen(open);
    document.body.classList.toggle('tawk-chat-open', open);
    if (!open) {
      openChatAttemptRef.current = false;
    }
  }, []);

  const hideNativeTawkBubble = useCallback(() => {
    window.Tawk_API?.hideWidget?.();
  }, []);

  const updateProfile = useCallback((nextProfile: VisitorProfile | null) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, []);

  const applyTawkProfile = useCallback((nextProfile: VisitorProfile) => {
  if (!window.Tawk_API?.setAttributes) {
    return;
  }

  // Proper email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  // Clean email safely
  const cleanEmail = nextProfile.email?.trim()
    ? safeDecode(nextProfile.email.trim())
    : undefined;

  // Build attributes safely
  const attributes: Record<string, string> = {
    name: nextProfile.name || 'Visitor',
    phone: nextProfile.phone,
    mobile: nextProfile.phone,
    'phone-number': nextProfile.phone,
  };

  // Only add email if valid
  if (cleanEmail && isValidEmail(cleanEmail)) {
    attributes.email = cleanEmail;
  }

  window.Tawk_API.setAttributes(attributes, (error) => {
    if (!error) {
      return;
    }

    const errorText =
      typeof error === 'string'
        ? error
        : (
            error as {
              code?: string;
              name?: string;
              message?: string;
            }
          )?.code ||
          (
            error as {
              code?: string;
              name?: string;
              message?: string;
            }
          )?.name ||
          (
            error as {
              code?: string;
              name?: string;
              message?: string;
            }
          )?.message ||
          '';

    // Ignore invalid email errors completely
    // because Tawk may cache old visitor email internally
    if (errorText.includes('INVALID_EMAIL')) {
      console.warn('Tawk ignored invalid email.');
      return;
    }

    console.error('Unable to set Tawk visitor attributes:', error);
  });

  // Optional analytics event
  window.Tawk_API.addEvent?.(
    'visitor-profile-collected',
    {
      source: nextProfile.isAuthenticated
        ? 'shopify-customer'
        : 'guest-form',
      hasPhone: nextProfile.phone ? 'yes' : 'no',
      phone: nextProfile.phone,
      mobile: nextProfile.phone,
    },
    () => {}
  );
}, []);

  const maximizeTawkChat = useCallback(() => {
    if (!profileRef.current?.phone) {
      return false;
    }

    applyTawkProfile(profileRef.current);
    window.Tawk_API?.showWidget?.();
    window.Tawk_API?.maximize?.();
    openChatAttemptRef.current = true;
    return true;
  }, [applyTawkProfile]);

  const showProfileForm = useCallback(() => {
    if (needsProfileRef.current) {
      return;
    }

    const currentProfile = profileRef.current;
    shouldOpenAfterProfile.current = true;
    window.Tawk_API?.minimize?.();
    hideNativeTawkBubble();
    setTawkChatOpen(false);
    setNameInput(currentProfile?.name ?? '');
    setPhoneInput(currentProfile?.phone?.replace(/^\+91/, '') ?? '');
    setFieldErrors({});
    needsProfileRef.current = true;
    setNeedsProfile(true);
  }, [hideNativeTawkBubble, setTawkChatOpen]);

  const requestProfileBeforeChat = useCallback(() => {
    const currentProfile = profileRef.current;

    if (currentProfile?.phone) {
      applyTawkProfile(currentProfile);
      return true;
    }

    showProfileForm();
    return false;
  }, [applyTawkProfile, showProfileForm]);

  const loadCustomerProfile = useCallback(async () => {
    const storedProfile = getStoredGuestProfile();

    try {
      const response = await fetch('/api/tawk/customer', { cache: 'no-store' });
      const data = await response.json();

      if (data.isAuthenticated && data.customer) {
        const storedPhone =
          storedProfile && storedProfile.email === data.customer.email
            ? storedProfile.phone
            : '';
        const customerProfile: VisitorProfile = {
          name: data.customer.name || data.customer.email?.split('@')[0] || 'Customer',
          email: data.customer.email,
          phone:
            normalizeIndianMobile(data.customer.phone || storedPhone || '') ??
            '',
          isAuthenticated: true,
        };

        const validPhone = normalizeIndianMobile(customerProfile.phone);
        if (validPhone) {
          customerProfile.phone = validPhone;
          applyTawkProfile(customerProfile);
        }

        updateProfile(customerProfile);

        return;
      }
    } catch (error) {
      console.error('Unable to load Tawk customer profile:', error);
    }

    if (storedProfile?.phone) {
      const validPhone = normalizeIndianMobile(storedProfile.phone);
      if (validPhone) {
        const validProfile = { ...storedProfile, phone: validPhone };
        updateProfile(validProfile);
        applyTawkProfile(validProfile);
      }
    }
  }, [applyTawkProfile, updateProfile]);

  const openChatFromLauncher = useCallback(() => {
    launcherCollapsedRef.current = false;
    setLauncherCollapsed(false);

    try {
      sessionStorage.removeItem(TAWK_LAUNCHER_COLLAPSED_KEY);
    } catch {
      /* ignore */
    }

    if (!TAWK_EMBED.isConfigured) {
      showProfileForm();
      return;
    }

    if (!requestProfileBeforeChat()) {
      return;
    }

    if (!tawkReadyRef.current || !window.Tawk_API?.maximize) {
      pendingChatOpenRef.current = true;
      return;
    }

    pendingChatOpenRef.current = false;
    maximizeTawkChat();
  }, [maximizeTawkChat, requestProfileBeforeChat, showProfileForm]);

  const handleLauncherCollapse = useCallback(() => {
    launcherCollapsedRef.current = true;
    setLauncherCollapsed(true);

    try {
      sessionStorage.setItem(TAWK_LAUNCHER_COLLAPSED_KEY, '1');
    } catch {
      /* ignore */
    }

    window.Tawk_API?.minimize?.();
    setTawkChatOpen(false);
    hideNativeTawkBubble();
  }, [hideNativeTawkBubble, setTawkChatOpen]);

  const handleLauncherExpand = useCallback(() => {
    launcherCollapsedRef.current = false;
    setLauncherCollapsed(false);

    try {
      sessionStorage.removeItem(TAWK_LAUNCHER_COLLAPSED_KEY);
    } catch {
      /* ignore */
    }

    hideNativeTawkBubble();
  }, [hideNativeTawkBubble]);

  const configureTawk = useCallback(() => {
    if (tawkConfiguredRef.current) {
      return;
    }
    tawkConfiguredRef.current = true;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const previousOnLoad = window.Tawk_API.onLoad;

    window.Tawk_API.onLoad = () => {
      previousOnLoad?.();
      tawkReadyRef.current = true;
      hideNativeTawkBubble();

      void loadCustomerProfile().then(() => {
        if (pendingChatOpenRef.current && profileRef.current?.phone) {
          pendingChatOpenRef.current = false;
          maximizeTawkChat();
        }
      });
    };

    if (typeof window.Tawk_API.showWidget === 'function') {
      tawkReadyRef.current = true;
      loadCustomerProfile();
      hideNativeTawkBubble();
    }

    window.Tawk_API.onChatMaximized = () => {
      openChatAttemptRef.current = false;

      if (profileRef.current?.phone) {
        applyTawkProfile(profileRef.current);
        setTawkChatOpen(true);
        return;
      }

      showProfileForm();
    };

    window.Tawk_API.onChatMinimized = () => {
      setTawkChatOpen(false);
      hideNativeTawkBubble();
    };

    window.Tawk_API.onChatHidden = () => {
      setTawkChatOpen(false);
      hideNativeTawkBubble();
    };
  }, [
    applyTawkProfile,
    hideNativeTawkBubble,
    loadCustomerProfile,
    maximizeTawkChat,
    setTawkChatOpen,
    showProfileForm,
  ]);

  useEffect(() => {
    if (!TAWK_EMBED.isConfigured) {
      return;
    }

    configureTawk();

    if (!hasLoadedProfile.current) {
      hasLoadedProfile.current = true;
      loadCustomerProfile();
    }
  }, [configureTawk, loadCustomerProfile]);

  useEffect(() => {
    try {
      const storedCollapsed =
        sessionStorage.getItem(TAWK_LAUNCHER_COLLAPSED_KEY) === '1';
      launcherCollapsedRef.current = storedCollapsed;
      setLauncherCollapsed(storedCollapsed);
    } catch {
      launcherCollapsedRef.current = false;
      setLauncherCollapsed(false);
    }

    setLauncherHydrated(true);
  }, []);

  useEffect(() => {
    launcherCollapsedRef.current = launcherCollapsed;
  }, [launcherCollapsed]);

  useEffect(() => {
    document.body.classList.add('tawk-custom-launcher');

    return () => {
      document.body.classList.remove('tawk-custom-launcher');
      document.body.classList.remove('tawk-chat-open');
    };
  }, []);

  useEffect(() => {
    if (!tawkReadyRef.current) {
      return;
    }

    hideNativeTawkBubble();
  }, [hideNativeTawkBubble, launcherCollapsed]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    needsProfileRef.current = needsProfile;
  }, [needsProfile]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requireName = !profile?.isAuthenticated;
    const { errors, phone: nextPhone } = validateChatForm(
      nameInput,
      phoneInput,
      requireName
    );

    if (errors.name || errors.phone || !nextPhone) {
      setFieldErrors(errors);
      return;
    }

    const nextName =
      nameInput.trim() || profile?.name?.trim() || 'Website Visitor';

    const nextProfile: VisitorProfile = {
      name: nextName,
      email: profile?.email,
      phone: nextPhone,
      isAuthenticated: profile?.isAuthenticated,
    };

    setFieldErrors({});
    updateProfile(nextProfile);
    applyTawkProfile(nextProfile);

    localStorage.setItem(
      TAWK_PROFILE_STORAGE_KEY,
      JSON.stringify(nextProfile)
    );

    needsProfileRef.current = false;
    setNeedsProfile(false);

    if (shouldOpenAfterProfile.current) {
      shouldOpenAfterProfile.current = false;

      if (!tawkReadyRef.current || !window.Tawk_API?.maximize) {
        pendingChatOpenRef.current = true;
        return;
      }

      window.setTimeout(() => {
        maximizeTawkChat();
      }, 100);
    }
  };

  return (
    <>
      {TAWK_EMBED.isConfigured ? (
        <>
          <Script id="tawk-config" strategy="afterInteractive">
            {`
              window.Tawk_API = window.Tawk_API || {};
              window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();
            `}
          </Script>
          <Script
            id="tawk-to"
            src={TAWK_EMBED.embedUrl!}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        </>
      ) : null}

      {needsProfile ? (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/45 px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-gray-950">Start chat</h2>
            <p className="mt-1 text-sm text-gray-600">
              Please share your details so our team can help you faster.
            </p>

            {!profile?.isAuthenticated ? (
              <label className="mt-4 block text-sm font-medium text-gray-800">
                Name
                <input
                  value={nameInput}
                  onChange={(event) => {
                    setNameInput(event.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-gray-950 outline-none focus:border-blue-500 ${
                    fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your name"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                />
                {fieldErrors.name ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {fieldErrors.name}
                  </span>
                ) : null}
              </label>
            ) : null}

            <label className="mt-4 block text-sm font-medium text-gray-800">
              Mobile number
              <input
                value={phoneInput}
                onChange={(event) => {
                  setPhoneInput(event.target.value);
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-gray-950 outline-none focus:border-blue-500 ${
                  fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="98765 43210"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={14}
                aria-invalid={Boolean(fieldErrors.phone)}
                autoFocus={profile?.isAuthenticated}
              />
              <span className="mt-1 block text-xs text-gray-500">
                10-digit Indian mobile (starts with 6, 7, 8, or 9)
              </span>
              {fieldErrors.phone ? (
                <span className="mt-1 block text-sm text-red-600">
                  {fieldErrors.phone}
                </span>
              ) : null}
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  needsProfileRef.current = false;
                  setNeedsProfile(false);
                  setFieldErrors({});
                  shouldOpenAfterProfile.current = false;
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {launcherHydrated && !chatOpen ? (
        <LiveChatLauncher
          collapsed={launcherCollapsed}
          onCollapse={handleLauncherCollapse}
          onExpand={handleLauncherExpand}
          onOpenChat={openChatFromLauncher}
        />
      ) : null}
    </>
  );
}

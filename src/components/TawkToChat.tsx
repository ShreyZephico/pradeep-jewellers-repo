'use client';

import Script from 'next/script';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import LiveChatLauncher from '@/components/LiveChatLauncher';

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

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }

  return digits ? `+${digits}` : '';
}

function getStoredGuestProfile(): VisitorProfile | null {
  try {
    const profile = localStorage.getItem(TAWK_PROFILE_STORAGE_KEY);

    return profile ? (JSON.parse(profile) as VisitorProfile) : null;
  } catch {
    return null;
  }
}

function tawkAttributesForProfile(profile: VisitorProfile) {
  return {
    name: profile.name,
    ...(profile.email ? { email: profile.email } : {}),
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
  const [formError, setFormError] = useState('');
  const shouldOpenAfterProfile = useRef(false);
  const hasLoadedProfile = useRef(false);
  const profileRef = useRef<VisitorProfile | null>(null);
  const needsProfileRef = useRef(false);
  const [launcherCollapsed, setLauncherCollapsed] = useState(false);
  const [launcherHydrated, setLauncherHydrated] = useState(false);
  const launcherCollapsedRef = useRef(false);
  const tawkReadyRef = useRef(false);
  const [chatOpen, setChatOpen] = useState(false);

  const setTawkChatOpen = useCallback((open: boolean) => {
    setChatOpen(open);
    document.body.classList.toggle('tawk-chat-open', open);
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

    window.Tawk_API.setAttributes(
      tawkAttributesForProfile(nextProfile),
      (error) => {
        if (error) {
          console.error('Unable to set Tawk visitor attributes:', error);
        }
      }
    );

    window.Tawk_API.addEvent?.(
      'visitor-profile-collected',
      {
        source: nextProfile.isAuthenticated ? 'shopify-customer' : 'guest-form',
        hasPhone: nextProfile.phone ? 'yes' : 'no',
        phone: nextProfile.phone,
        mobile: nextProfile.phone,
      },
      () => {}
    );
  }, []);

  const requestProfileBeforeChat = useCallback(() => {
    const currentProfile = profileRef.current;

    if (currentProfile?.phone) {
      applyTawkProfile(currentProfile);
      return;
    }

    if (needsProfileRef.current) {
      return;
    }

    shouldOpenAfterProfile.current = true;
    window.Tawk_API?.minimize?.();
    setNameInput(currentProfile?.name ?? '');
    setPhoneInput(currentProfile?.phone ?? '');
    needsProfileRef.current = true;
    setNeedsProfile(true);
  }, [applyTawkProfile]);

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
          phone: normalizePhone(data.customer.phone || storedPhone || ''),
          isAuthenticated: true,
        };

        updateProfile(customerProfile);

        if (customerProfile.phone) {
          applyTawkProfile(customerProfile);
        }

        return;
      }
    } catch (error) {
      console.error('Unable to load Tawk customer profile:', error);
    }

    if (storedProfile?.phone) {
      updateProfile(storedProfile);
      applyTawkProfile(storedProfile);
    }
  }, [applyTawkProfile, updateProfile]);

  const openChatFromLauncher = useCallback(() => {
    const currentProfile = profileRef.current;

    if (!currentProfile?.phone) {
      shouldOpenAfterProfile.current = true;
      requestProfileBeforeChat();
      return;
    }

    applyTawkProfile(currentProfile);
    window.Tawk_API?.showWidget?.();
    window.Tawk_API?.maximize?.();
    setTawkChatOpen(true);
  }, [applyTawkProfile, requestProfileBeforeChat, setTawkChatOpen]);

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
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = () => {
      tawkReadyRef.current = true;
      loadCustomerProfile();
      hideNativeTawkBubble();
    };

    window.Tawk_API.onChatMaximized = () => {
      requestProfileBeforeChat();

      if (profileRef.current?.phone) {
        setTawkChatOpen(true);
      } else {
        setTawkChatOpen(false);
      }
    };

    window.Tawk_API.onChatMinimized = () => {
      setTawkChatOpen(false);
      hideNativeTawkBubble();
    };

    window.Tawk_API.onChatHidden = () => {
      setTawkChatOpen(false);
      hideNativeTawkBubble();
    };
  }, [hideNativeTawkBubble, loadCustomerProfile, requestProfileBeforeChat, setTawkChatOpen]);

  useEffect(() => {
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

    const nextPhone = normalizePhone(phoneInput);
    const nextName = nameInput.trim() || profile?.name || 'Website Visitor';

    if (!nextPhone || nextPhone.length < 8) {
      setFormError('Please enter a valid mobile number.');
      return;
    }

    const nextProfile: VisitorProfile = {
      name: nextName,
      email: profile?.email,
      phone: nextPhone,
      isAuthenticated: profile?.isAuthenticated,
    };

    setFormError('');
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
      window.setTimeout(() => {
        window.Tawk_API?.showWidget?.();
        window.Tawk_API?.maximize?.();
      }, 100);
    }
  };

  return (
    <>
      <Script id="tawk-config" strategy="afterInteractive">
        {`
          window.Tawk_API = window.Tawk_API || {};
          window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();
        `}
      </Script>
      <Script
        id="tawk-to"
        src="https://embed.tawk.to/6a043a506a19e61c35985f46/1jog87ivq"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />

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
                  onChange={(event) => setNameInput(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-blue-500"
                  placeholder="Your name"
                />
              </label>
            ) : null}

            <label className="mt-4 block text-sm font-medium text-gray-800">
              Mobile number
              <input
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none focus:border-blue-500"
                placeholder="+91 98765 43210"
                inputMode="tel"
                autoFocus
              />
            </label>

            {formError ? (
              <p className="mt-3 text-sm font-medium text-red-600">{formError}</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setNeedsProfile(false)}
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

      {launcherHydrated && !chatOpen && !needsProfile ? (
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

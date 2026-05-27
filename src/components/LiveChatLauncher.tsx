'use client';

import Image from 'next/image';
import { useState } from 'react';
import contactData from '@/data/contactDatas.json';
import { getImageUrl } from '@/utils/cloudinary';
import './css/live-chat.css';

const BRAND_LOGO_URL = getImageUrl(contactData.brand.logo);
const BRAND_NAME = contactData.brand.name;

type LiveChatLauncherProps = {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onOpenChat: () => void;
};

export default function LiveChatLauncher({
  collapsed,
  onCollapse,
  onExpand,
  onOpenChat,
}: LiveChatLauncherProps) {
  const [logoError, setLogoError] = useState(false);

  if (collapsed) {
    return (
      <div className="live-chat live-chat--collapsed" aria-live="polite">
        <button
          type="button"
          className="live-chat__tab"
          onClick={() => {
            onExpand();
            onOpenChat();
          }}
          aria-label="Open live chat"
        >
          <span className="live-chat__tab-label">Live Chat</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="live-chat live-chat--expanded"
      role="complementary"
      aria-label="Live chat invitation"
    >
      <button
        type="button"
        className="live-chat__close"
        onClick={onCollapse}
        aria-label="Minimize live chat"
      >
        ×
      </button>

      <div className="live-chat__row">
        

        <button
          type="button"
          className="live-chat__avatar-btn"
          onClick={onOpenChat}
          aria-label={`Chat with ${BRAND_NAME}`}
        >
          <span className="live-chat__avatar-wrap">
            {!logoError ? (
              <Image
                src={BRAND_LOGO_URL}
                alt={BRAND_NAME}
                fill
                sizes="56px"
                className="live-chat__logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="live-chat__logo-fallback" aria-hidden>
                PJ
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

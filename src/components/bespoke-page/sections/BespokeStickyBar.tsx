"use client";

import { useEffect, useState } from "react";

import data from "@/data/contactDatas.json";

import { BESPOKE_STICKY_BAR } from "../content";

type Props = { onQuote: () => void };

export default function BespokeStickyBar({ onQuote }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      
      <div className={`bespoke-sticky${visible ? " is-visible" : ""}`}>
        <button type="button" className="bespoke-page__btn" onClick={onQuote}>
          {BESPOKE_STICKY_BAR.quoteLabel}
        </button>
        <a
          href={data.social.whatsapp}
          className="bespoke-sticky__wa"
          target="_blank"
          rel="noopener noreferrer"
        >
          {BESPOKE_STICKY_BAR.whatsappLabel}
        </a>
      </div>
    </>
  );
}

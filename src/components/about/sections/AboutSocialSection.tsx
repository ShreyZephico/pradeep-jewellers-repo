"use client";

import { useEffect, useRef } from "react";

import SocialSection from "@/components/home/SocialSection";

import "../css/social-wrap.css";

export default function AboutSocialSection() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = wrapRef.current?.querySelector(".social-section");
    if (section) {
      section.classList.add("social-section--visible");
    }
  }, []);

  return (
    <div ref={wrapRef} className="about-social-wrap">
      <SocialSection />
    </div>
  );
}

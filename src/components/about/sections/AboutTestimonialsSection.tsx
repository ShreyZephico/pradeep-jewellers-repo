"use client";

import { useEffect, useRef } from "react";

import TestimonialsSection from "@/components/home/TestimonialsSection";

import "../css/testimonials-wrap.css";

export default function AboutTestimonialsSection() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = wrapRef.current?.querySelector(".testimonials-section");
    if (section) {
      section.classList.add("testimonials-section--visible");
    }
  }, []);

  return (
    <div ref={wrapRef} className="about-testimonials-wrap">
      <TestimonialsSection />
    </div>
  );
}

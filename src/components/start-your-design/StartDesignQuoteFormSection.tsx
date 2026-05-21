"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import data from "@/data/contactDatas.json";
import { normalizeIndianMobile } from "@/utils/indianPhone";

import { START_DESIGN_CATEGORIES } from "./content";

type Props = {
  categoryId: string;
  onSubmitted?: () => void;
};

function getWhatsAppNumber(): string {
  const wa = data.social.whatsapp;
  const m = wa.match(/wa\.me\/(\d+)/);
  return m ? m[1] : "919265075114";
}

function buildWhatsAppMessage(input: {
  name: string;
  phoneNational: string;
  category: string;
  budget: string;
  timeline: string;
  notes: string;
}): string {
  const lines = [
    "Hi Pradeep Jewellers, I want a custom design quotation.",
    `Name: ${input.name}`,
    `Mobile: +91 ${input.phoneNational}`,
    `Category: ${input.category}`,
    `Budget: ${input.budget || "Not sure"}`,
    `Timeline: ${input.timeline || "Flexible"}`,
    input.notes.trim() ? `Notes: ${input.notes.trim()}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export default function StartDesignQuoteFormSection({
  categoryId,
  onSubmitted,
}: Props) {
  const waNumber = useMemo(() => getWhatsAppNumber(), []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openWhatsApp(prefill: string) {
    window.location.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(
      prefill
    )}`;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    const national = normalizeIndianMobile(phone);
    if (!national) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    const categoryLabel =
      START_DESIGN_CATEGORIES.find((c) => c.id === categoryId)?.label ?? "Custom";

    const message = buildWhatsAppMessage({
      name: trimmedName,
      phoneNational: national,
      category: categoryLabel,
      budget,
      timeline,
      notes,
    });

    onSubmitted?.();
    openWhatsApp(message);
  }

  return (
    <>
      <div className="start-design-section__head">
        <div>
          <h2 id="start-design-form-title" className="start-design-section__title">
            Get your quotation
          </h2>
          <p className="start-design-section__hint">
            We’ll reply on WhatsApp with an estimate and next steps.
          </p>
        </div>
      </div>

      <div className="start-design-card start-design-form">
        <form onSubmit={handleSubmit}>
          <div className="start-design-form__row">
            <div className="start-design-field">
              <label htmlFor="sd-name">Name</label>
              <input
                id="sd-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </div>

            <div className="start-design-field">
              <label htmlFor="sd-phone">Mobile number</label>
              <input
                id="sd-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                maxLength={14}
              />
            </div>
          </div>

          <div className="start-design-form__grid">
            <div className="start-design-field">
              <label htmlFor="sd-budget">Budget (optional)</label>
              <input
                id="sd-budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹30k–₹50k"
              />
            </div>

            <div className="start-design-field">
              <label htmlFor="sd-timeline">Timeline (optional)</label>
              <input
                id="sd-timeline"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. 2 weeks"
              />
            </div>

            <div className="start-design-field">
              <label htmlFor="sd-notes">Notes / reference link (optional)</label>
              <textarea
                id="sd-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Share details (stone type, weight, finish) or paste a link to reference."
              />
            </div>
          </div>

          {error ? <p className="start-design-form__error">{error}</p> : null}
          <p className="start-design-form__fine">
            Tip: After WhatsApp opens, attach your reference photos there for the
            fastest quote.
          </p>

          <div className="start-design-form__actions">
            <button type="submit" className="start-design-btn start-design-btn--primary">
              Send on WhatsApp <span aria-hidden>→</span>
            </button>
            <Link className="start-design-btn start-design-btn--secondary" href="/">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}


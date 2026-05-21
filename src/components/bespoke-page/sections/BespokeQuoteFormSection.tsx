"use client";

import { FormEvent, useMemo, useState } from "react";

import BespokeImage from "../BespokeImage";

import data from "@/data/contactDatas.json";
import { normalizeIndianMobile } from "@/utils/indianPhone";

import {
  BESPOKE_BUDGET_OPTIONS,
  BESPOKE_CONTACT_METHODS,
  BESPOKE_FORM_IMAGE,
  BESPOKE_FORM_IMAGE_ALT,
  BESPOKE_FORM_SECTION,
  BESPOKE_GEMSTONES,
  BESPOKE_JEWELLERY_TYPES,
  BESPOKE_METALS,
} from "../content";

function getWhatsAppNumber(): string {
  const m = data.social.whatsapp.match(/wa\.me\/(\d+)/);
  return m ? m[1] : "919265075114";
}

export default function BespokeQuoteFormSection() {
  const waNumber = useMemo(() => getWhatsAppNumber(), []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [jewelleryType, setJewelleryType] = useState(BESPOKE_JEWELLERY_TYPES[0]);
  const [inspiration, setInspiration] = useState("");
  const [metals, setMetals] = useState<string[]>([]);
  const [gems, setGems] = useState<string[]>([]);
  const [ringSize, setRingSize] = useState("");
  const [budget, setBudget] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [occasion, setOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [oldGold, setOldGold] = useState(false);
  const [contactVia, setContactVia] = useState(BESPOKE_CONTACT_METHODS[0]);
  const [fileCount, setFileCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function toggleChip(list: string[], value: string, setter: (v: string[]) => void) {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim().includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    const national = normalizeIndianMobile(phone);
    if (!national) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!city.trim()) {
      setError("Please enter your city.");
      return;
    }
    if (!budget) {
      setError("Please select a budget range.");
      return;
    }

    const lines = [
      BESPOKE_FORM_SECTION.whatsappIntro,
      `Name: ${trimmedName}`,
      `Email: ${email.trim()}`,
      `Mobile: +91 ${national}`,
      `City: ${city.trim()}`,
      `Type: ${jewelleryType}`,
      metals.length ? `Metal: ${metals.join(", ")}` : "",
      gems.length ? `Gemstones: ${gems.join(", ")}` : "",
      ringSize.trim() ? `Ring size: ${ringSize.trim()}` : "",
      `Budget: ${budget}`,
      requiredBy ? `Required by: ${requiredBy}` : "",
      occasion.trim() ? `Occasion: ${occasion.trim()}` : "",
      oldGold ? "Old gold exchange: Yes" : "",
      `Contact via: ${contactVia}`,
      inspiration.trim() ? `Vision: ${inspiration.trim()}` : "",
      notes.trim() ? `Notes: ${notes.trim()}` : "",
      fileCount > 0
        ? `Reference images: ${fileCount} selected — please attach in this chat`
        : "",
    ].filter(Boolean);

    window.location.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  return (
    <section
      id="quote-form"
      className="bespoke-page__section"
      aria-labelledby="bespoke-form-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          {BESPOKE_FORM_SECTION.eyebrow}
        </p>
        <h2 id="bespoke-form-title" className="bespoke-page__title" data-reveal>
          {BESPOKE_FORM_SECTION.title}
        </h2>
        <p className="bespoke-page__lead" data-reveal>
          {BESPOKE_FORM_SECTION.lead}
        </p>
        <div className="bespoke-form__layout" data-reveal>
          <div className="bespoke-form__visual">
            <BespokeImage
              src={BESPOKE_FORM_IMAGE}
              alt={BESPOKE_FORM_IMAGE_ALT}
              fill
              sizes="(max-width:960px) 100vw, 40vw"
            />
          </div>
          <div className="bespoke-form__card">
            <form onSubmit={handleSubmit}>
              <div className="bespoke-form__grid bespoke-form__grid--2">
                <div className="bespoke-form__field">
                  <label htmlFor="bq-name">Full Name *</label>
                  <input
                    id="bq-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="bespoke-form__field">
                  <label htmlFor="bq-email">Email *</label>
                  <input
                    id="bq-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="bespoke-form__field">
                  <label htmlFor="bq-phone">Phone *</label>
                  <input
                    id="bq-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
                <div className="bespoke-form__field">
                  <label htmlFor="bq-city">City / Location *</label>
                  <input
                    id="bq-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="bespoke-form__field bespoke-form__field--gap">
                <label htmlFor="bq-type">Jewellery Type *</label>
                <select
                  id="bq-type"
                  value={jewelleryType}
                  onChange={(e) => setJewelleryType(e.target.value)}
                  required
                >
                  {BESPOKE_JEWELLERY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bespoke-form__field">
                <label htmlFor="bq-inspiration">Design inspiration</label>
                <textarea
                  id="bq-inspiration"
                  rows={3}
                  value={inspiration}
                  onChange={(e) => setInspiration(e.target.value)}
                  placeholder="Describe your vision, style references, size preferences…"
                />
              </div>

              <div className="bespoke-form__field">
                <label htmlFor="bq-files">Reference images</label>
                <input
                  id="bq-files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
                />
                <p className="bespoke-form__note">{BESPOKE_FORM_SECTION.fileUploadNote}</p>
              </div>

              <div className="bespoke-form__field">
                <span>Preferred metal</span>
                <div className="bespoke-form__checks">
                  {BESPOKE_METALS.map((m) => (
                    <label key={m} className="bespoke-form__check">
                      <input
                        type="checkbox"
                        checked={metals.includes(m)}
                        onChange={() => toggleChip(metals, m, setMetals)}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bespoke-form__field">
                <span>Gemstone preference</span>
                <div className="bespoke-form__checks">
                  {BESPOKE_GEMSTONES.map((g) => (
                    <label key={g} className="bespoke-form__check">
                      <input
                        type="checkbox"
                        checked={gems.includes(g)}
                        onChange={() => toggleChip(gems, g, setGems)}
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div className="bespoke-form__grid bespoke-form__grid--2">
                <div className="bespoke-form__field">
                  <label htmlFor="bq-size">Ring size (if applicable)</label>
                  <input
                    id="bq-size"
                    value={ringSize}
                    onChange={(e) => setRingSize(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
                <div className="bespoke-form__field">
                  <label htmlFor="bq-budget">Budget range *</label>
                  <select
                    id="bq-budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  >
                    <option value="">Select range</option>
                    {BESPOKE_BUDGET_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bespoke-form__field">
                  <label htmlFor="bq-date">Required by</label>
                  <input
                    id="bq-date"
                    type="date"
                    value={requiredBy}
                    onChange={(e) => setRequiredBy(e.target.value)}
                  />
                </div>
                <div className="bespoke-form__field">
                  <label htmlFor="bq-occasion">Purpose / occasion</label>
                  <input
                    id="bq-occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Wedding, anniversary, gift…"
                  />
                </div>
              </div>

              <div className="bespoke-form__field">
                <label htmlFor="bq-notes">Special requests</label>
                <textarea
                  id="bq-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <label className="bespoke-form__check">
                <input
                  type="checkbox"
                  checked={oldGold}
                  onChange={(e) => setOldGold(e.target.checked)}
                />
                I have old gold to exchange
              </label>

              <div className="bespoke-form__field bespoke-form__field--gap-sm">
                <label htmlFor="bq-contact">Preferred contact</label>
                <select
                  id="bq-contact"
                  value={contactVia}
                  onChange={(e) => setContactVia(e.target.value)}
                >
                  {BESPOKE_CONTACT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="bespoke-form__error">
                  {error}
                </p>
              )}

              <button type="submit" className="bespoke-page__btn bespoke-form__submit">
                {BESPOKE_FORM_SECTION.submitLabel}
              </button>

              <div className="bespoke-form__trust">
                {BESPOKE_FORM_SECTION.trustBadges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

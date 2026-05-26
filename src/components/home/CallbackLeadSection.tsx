"use client";

import { FormEvent, useEffect, useRef, useState, type CSSProperties } from "react";

import data from "@/data/contactDatas.json";

import "./css/callback-lead.css";

const BENEFITS = [
  "Our team is notified instantly by email",
  "You receive one confirmation email with your request details",
  "No obligation — we call at your preferred time",
] as const;

function normalizeIndianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function SuccessCheckIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default function CallbackLeadSection() {
  const s = data.callbackLeadSection;
  const sectionRef = useRef<HTMLElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState(s.timeOptions[0] ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reveal = () => setFormReady(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      reveal();
    }

    return () => observer.disconnect();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizeIndianPhone(phone);

    if (!trimmedName) {
      setError(s.errors.nameRequired);
      return;
    }

    if (!trimmedEmail) {
      setError(s.errors.emailRequired);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(s.errors.emailInvalid);
      return;
    }

    if (!phone.trim()) {
      setError(s.errors.phoneRequired);
      return;
    }

    if (!normalizedPhone) {
      setError(s.errors.phoneInvalid);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/callback-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: normalizedPhone,
          preferredTime: preferredTime || s.timeOptions[0],
          message: message.trim(),
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? s.errors.submitFailed);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(s.errors.submitFailed);
    } finally {
      setLoading(false);
    }
  }

  const formClassName = `callback-lead-section__form${
    formReady ? " callback-lead-section__form--ready" : ""
  }`;

  let fieldIndex = 0;

  return (
    <section
      id="callback"
      ref={sectionRef}
      className="callback-lead-section"
      aria-labelledby="callback-lead-heading"
    >
      <div className="callback-lead-section__inner">
        <div className="callback-lead-section__layout">
          <div className="callback-lead-section__intro">
            <div className="callback-lead-section__badge-row">
              <span
                className="callback-lead-section__badge-line"
                aria-hidden
              />
              <p className="callback-lead-section__badge">{s.badge}</p>
            </div>
            <h2
              id="callback-lead-heading"
              className="callback-lead-section__title"
            >
              {s.title}
            </h2>
            <p className="callback-lead-section__description">
              {s.description}
            </p>
            <ul className="callback-lead-section__benefits">
              {BENEFITS.map((text, index) => (
                <li
                  key={text}
                  className="callback-lead-section__benefit"
                  style={{ "--card-index": index } as CSSProperties}
                >
                  <span
                    className="callback-lead-section__benefit-dot"
                    aria-hidden
                  />
                  <p className="callback-lead-section__benefit-text">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="callback-lead-section__form-panel">
            {submitted ? (
              <div className="callback-lead-section__success">
                <div className="callback-lead-section__success-icon">
                  <SuccessCheckIcon />
                </div>
                <h3 className="callback-lead-section__success-title">
                  {s.successTitle}
                </h3>
                <p className="callback-lead-section__success-message">
                  {s.successMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="callback-lead-section__success-reset"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className={formClassName}
                noValidate
              >
                {error ? (
                  <p
                    className="callback-lead-section__error"
                    role="alert"
                    style={
                      { "--field-index": fieldIndex++ } as CSSProperties
                    }
                  >
                    {error}
                  </p>
                ) : null}

                <div
                  className="callback-lead-section__fields-row callback-lead-section__field"
                  style={
                    { "--field-index": fieldIndex++ } as CSSProperties
                  }
                >
                  <div className="callback-lead-section__field">
                    <label
                      htmlFor="callback-name"
                      className="callback-lead-section__label"
                    >
                      {s.fields.nameLabel}
                    </label>
                    <input
                      id="callback-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={s.fields.namePlaceholder}
                      className="callback-lead-section__input"
                    />
                  </div>

                  <div className="callback-lead-section__field">
                    <label
                      htmlFor="callback-email"
                      className="callback-lead-section__label"
                    >
                      {s.fields.emailLabel}
                    </label>
                    <input
                      id="callback-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={s.fields.emailPlaceholder}
                      className="callback-lead-section__input"
                    />
                  </div>
                </div>

                <div
                  className="callback-lead-section__fields-row callback-lead-section__field"
                  style={
                    { "--field-index": fieldIndex++ } as CSSProperties
                  }
                >
                  <div className="callback-lead-section__field">
                    <label
                      htmlFor="callback-phone"
                      className="callback-lead-section__label"
                    >
                      {s.fields.phoneLabel}
                    </label>
                    <div className="callback-lead-section__phone-wrap">
                      <span className="callback-lead-section__phone-prefix">
                        +91
                      </span>
                      <input
                        id="callback-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={s.fields.phonePlaceholder}
                        className="callback-lead-section__phone-input"
                      />
                    </div>
                  </div>

                  <div className="callback-lead-section__field">
                    <label
                      htmlFor="callback-time"
                      className="callback-lead-section__label"
                    >
                      {s.fields.timeLabel}
                    </label>
                    <select
                      id="callback-time"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="callback-lead-section__select"
                    >
                      {s.timeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  className="callback-lead-section__field"
                  style={
                    { "--field-index": fieldIndex++ } as CSSProperties
                  }
                >
                  <label
                    htmlFor="callback-message"
                    className="callback-lead-section__label"
                  >
                    {s.fields.messageLabel}
                  </label>
                  <textarea
                    id="callback-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={s.fields.messagePlaceholder}
                    className="callback-lead-section__textarea"
                  />
                </div>

                <div
                  className="callback-lead-section__field"
                  style={
                    { "--field-index": fieldIndex++ } as CSSProperties
                  }
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="callback-lead-section__submit"
                  >
                    {loading ? "Sending…" : s.submitText}
                  </button>
                  <p className="callback-lead-section__hint">{s.submitHint}</p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

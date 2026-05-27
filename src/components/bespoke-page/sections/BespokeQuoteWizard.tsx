"use client";

import Image from "next/image";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import data from "@/data/contactDatas.json";
import { normalizeIndianMobile } from "@/utils/indianPhone";

import {
  BESPOKE_BUDGET_OPTIONS,
  BESPOKE_CONTACT_METHODS,
  BESPOKE_FORM_SECTION,
  BESPOKE_GEMSTONES,
  BESPOKE_JEWELLERY_TYPES,
  BESPOKE_METALS,
} from "../content";

const STEP_COUNT = BESPOKE_FORM_SECTION.steps.length;
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

function getWhatsAppNumber(): string {
  const m = data.social.whatsapp.match(/wa\.me\/(\d+)/);
  return m ? m[1] : "919265075114";
}

function toggleChip(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((x) => x !== value)
    : [...list, value];
}

async function uploadReferenceImages(
  files: File[]
): Promise<{ urls: string[]; skipped: boolean }> {
  if (files.length === 0) return { urls: [], skipped: false };

  const urls: string[] = [];
  let skipped = false;

  for (const file of files) {
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/bespoke/upload", {
      method: "POST",
      body,
    });

    const json = (await res.json()) as { url?: string; error?: string };

    if (res.status === 503) {
      skipped = true;
      break;
    }

    if (!res.ok || !json.url) {
      throw new Error(json.error ?? "Image upload failed");
    }

    urls.push(json.url);
  }

  return { urls, skipped };
}

function buildWhatsAppMessage(payload: {
  name: string;
  email: string;
  phone: string;
  city: string;
  contactVia: string;
  jewelleryType: string;
  inspiration: string;
  metals: string[];
  gems: string[];
  ringSize: string;
  budget: string;
  requiredBy: string;
  occasion: string;
  notes: string;
  oldGold: boolean;
  imageUrls: string[];
  uploadSkipped: boolean;
  localImageCount: number;
}): string {
  const lines = [
    BESPOKE_FORM_SECTION.whatsappIntro,
    "",
    "— Contact —",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Mobile: +91 ${payload.phone}`,
    `City: ${payload.city}`,
    `Preferred contact: ${payload.contactVia}`,
    "",
    "— Design —",
    `Type: ${payload.jewelleryType}`,
    payload.inspiration ? `Vision: ${payload.inspiration}` : "",
    "",
    "— Preferences —",
    payload.metals.length ? `Metal: ${payload.metals.join(", ")}` : "",
    payload.gems.length ? `Gemstones: ${payload.gems.join(", ")}` : "",
    payload.ringSize ? `Ring size: ${payload.ringSize}` : "",
    `Budget: ${payload.budget}`,
    payload.requiredBy ? `Required by: ${payload.requiredBy}` : "",
    payload.occasion ? `Occasion: ${payload.occasion}` : "",
    payload.oldGold ? "Old gold exchange: Yes" : "",
    payload.notes ? `Notes: ${payload.notes}` : "",
  ].filter(Boolean);

  if (payload.imageUrls.length > 0) {
    lines.push("", "— Reference images —");
    payload.imageUrls.forEach((url, i) => {
      lines.push(`${i + 1}. ${url}`);
    });
  } else if (payload.uploadSkipped && payload.localImageCount > 0) {
    lines.push(
      "",
      `Reference images: ${payload.localImageCount} selected — please attach in this chat (upload was unavailable).`
    );
  }

  return lines.join("\n");
}

export default function BespokeQuoteWizard() {
  const waNumber = useMemo(() => getWhatsAppNumber(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [contactVia, setContactVia] = useState(BESPOKE_CONTACT_METHODS[0]);

  const [jewelleryType, setJewelleryType] = useState("");
  const [inspiration, setInspiration] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const [metals, setMetals] = useState<string[]>([]);
  const [gems, setGems] = useState<string[]>([]);
  const [ringSize, setRingSize] = useState("");
  const [budget, setBudget] = useState("");
  const [requiredBy, setRequiredBy] = useState("");
  const [occasion, setOccasion] = useState("");
  const [notes, setNotes] = useState("");
  const [oldGold, setOldGold] = useState(false);

  const currentStepMeta = BESPOKE_FORM_SECTION.steps[step];
  const progressPct = ((step + 1) / STEP_COUNT) * 100;

  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((img) =>
        URL.revokeObjectURL(img.previewUrl)
      );
    };
  }, []);

  const addImages = useCallback((fileList: FileList | null) => {
    if (!fileList?.length) return;

    setError(null);
    const next: PendingImage[] = [];
    const slotsLeft = MAX_IMAGES - pendingImages.length;

    for (let i = 0; i < fileList.length && next.length < slotsLeft; i++) {
      const file = fileList[i];
      if (!file.type.startsWith("image/")) {
        setError("Please choose image files only.");
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError("Each image must be 5 MB or smaller.");
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (fileList.length > slotsLeft && slotsLeft >= 0) {
      setError(`You can add up to ${MAX_IMAGES} images.`);
    }

    if (next.length) {
      setPendingImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    }
  }, [pendingImages.length]);

  function removeImage(id: string) {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function validateStep(index: number): string | null {
    if (index === 0) {
      if (name.trim().length < 2) return "Please enter your full name.";
      if (!email.trim().includes("@")) return "Please enter a valid email.";
      if (!normalizeIndianMobile(phone)) {
        return "Enter a valid 10-digit Indian mobile number.";
      }
      if (!city.trim()) return "Please enter your city.";
      return null;
    }
    if (index === 1) {
      if (!jewelleryType) return "Please select a jewellery type.";
      return null;
    }
    if (index === 2) {
      if (!budget) return "Please select a budget range.";
      return null;
    }
    return null;
  }

  function goNext() {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const msg = validateStep(2);
    if (msg) {
      setError(msg);
      setStep(2);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const national = normalizeIndianMobile(phone)!;
      const files = pendingImages.map((p) => p.file);
      const { urls, skipped } = await uploadReferenceImages(files);

      const text = buildWhatsAppMessage({
        name: name.trim(),
        email: email.trim(),
        phone: national,
        city: city.trim(),
        contactVia,
        jewelleryType,
        inspiration: inspiration.trim(),
        metals,
        gems,
        ringSize: ringSize.trim(),
        budget,
        requiredBy,
        occasion: occasion.trim(),
        notes: notes.trim(),
        oldGold,
        imageUrls: urls,
        uploadSkipped: skipped,
        localImageCount: files.length,
      });

      window.location.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="bespoke-wizard">
      <div className="bespoke-wizard__progress" aria-hidden>
        <div
          className="bespoke-wizard__progress-fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className="bespoke-wizard__steps" aria-label="Form progress">
        {BESPOKE_FORM_SECTION.steps.map((s, i) => (
          <li
            key={s.id}
            className={`bespoke-wizard__step-dot${
              i < step ? " bespoke-wizard__step-dot--done" : ""
            }${i === step ? " bespoke-wizard__step-dot--active" : ""}`}
            aria-current={i === step ? "step" : undefined}
          >
            <span className="bespoke-wizard__step-num">{i + 1}</span>
            <span className="bespoke-wizard__step-label">{s.title}</span>
          </li>
        ))}
      </ol>

      <header className="bespoke-wizard__header">
        <p className="bespoke-wizard__step-eyebrow">
          Step {step + 1} of {STEP_COUNT}
        </p>
        <h3 className="bespoke-wizard__step-title">{currentStepMeta.title}</h3>
        <p className="bespoke-wizard__step-subtitle">{currentStepMeta.subtitle}</p>
      </header>

      <form
        onSubmit={step === STEP_COUNT - 1 ? handleSubmit : (ev) => ev.preventDefault()}
        className="bespoke-wizard__form"
        noValidate
      >
        {step === 0 && (
          <div className="bespoke-wizard__panel">
            <div className="bespoke-form__grid bespoke-form__grid--2">
              <div className="bespoke-form__field">
                <label htmlFor="bq-name">Full name *</label>
                <input
                  id="bq-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Your name"
                  suppressHydrationWarning
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
                  placeholder="you@example.com"
                  suppressHydrationWarning
                />
              </div>
              <div className="bespoke-form__field">
                <label htmlFor="bq-phone">Mobile *</label>
                <input
                  id="bq-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="10-digit number"
                  suppressHydrationWarning
                />
              </div>
              <div className="bespoke-form__field">
                <label htmlFor="bq-city">City *</label>
                <input
                  id="bq-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai, Delhi…"
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className="bespoke-form__field bespoke-form__field--gap-sm">
              <label htmlFor="bq-contact">Preferred contact</label>
              <select
                id="bq-contact"
                value={contactVia}
                onChange={(e) => setContactVia(e.target.value)}
                suppressHydrationWarning
              >
                {BESPOKE_CONTACT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bespoke-wizard__panel">
            <div className="bespoke-form__field">
              <span className="bespoke-wizard__field-label">Jewellery type *</span>
              <div className="bespoke-wizard__type-grid" role="group" aria-label="Jewellery type">
                {BESPOKE_JEWELLERY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`bespoke-wizard__type-btn${
                      jewelleryType === t ? " bespoke-wizard__type-btn--active" : ""
                    }`}
                    aria-pressed={jewelleryType === t}
                    onClick={() => setJewelleryType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="bespoke-form__field bespoke-form__field--gap-sm">
              <label htmlFor="bq-inspiration">Design description</label>
              <textarea
                id="bq-inspiration"
                rows={4}
                value={inspiration}
                onChange={(e) => setInspiration(e.target.value)}
                placeholder="Style, size, references, redesign details…"
                suppressHydrationWarning
              />
            </div>

            <div className="bespoke-form__field">
              <span className="bespoke-wizard__field-label">Reference photos</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="bespoke-wizard__file-input"
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="bespoke-wizard__dropzone"
                onClick={() => fileInputRef.current?.click()}
                disabled={pendingImages.length >= MAX_IMAGES}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("bespoke-wizard__dropzone--drag");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("bespoke-wizard__dropzone--drag");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("bespoke-wizard__dropzone--drag");
                  addImages(e.dataTransfer.files);
                }}
              >
                <span className="bespoke-wizard__dropzone-icon" aria-hidden>
                  +
                </span>
                <span>{BESPOKE_FORM_SECTION.fileUploadHint}</span>
                <span className="bespoke-wizard__dropzone-meta">
                  {pendingImages.length}/{MAX_IMAGES} · max 5 MB each
                </span>
              </button>
              <p className="bespoke-form__note">{BESPOKE_FORM_SECTION.fileUploadNote}</p>

              {pendingImages.length > 0 && (
                <ul className="bespoke-wizard__previews">
                  {pendingImages.map((img) => (
                    <li key={img.id} className="bespoke-wizard__preview">
                      <Image
                        src={img.previewUrl}
                        alt=""
                        width={88}
                        height={88}
                        className="bespoke-wizard__preview-img"
                        unoptimized
                      />
                      <button
                        type="button"
                        className="bespoke-wizard__preview-remove"
                        onClick={() => removeImage(img.id)}
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bespoke-wizard__panel bespoke-wizard__panel--prefs">
            <div className="bespoke-wizard__option-group">
              <span className="bespoke-wizard__field-label">Preferred metal</span>
              <p className="bespoke-wizard__field-hint">Select all that apply</p>
              <div
                className="bespoke-wizard__chip-grid"
                role="group"
                aria-label="Preferred metal"
              >
                {BESPOKE_METALS.map((m) => {
                  const active = metals.includes(m);
                  return (
                    <label
                      key={m}
                      className={`bespoke-wizard__chip${
                        active ? " bespoke-wizard__chip--active" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="bespoke-wizard__chip-input"
                        checked={active}
                        onChange={() => setMetals((prev) => toggleChip(prev, m))}
                      />
                      <span>{m}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bespoke-wizard__option-group">
              <span className="bespoke-wizard__field-label">Gemstones</span>
              <p className="bespoke-wizard__field-hint">Select all that apply</p>
              <div
                className="bespoke-wizard__chip-grid"
                role="group"
                aria-label="Gemstones"
              >
                {BESPOKE_GEMSTONES.map((g) => {
                  const active = gems.includes(g);
                  return (
                    <label
                      key={g}
                      className={`bespoke-wizard__chip${
                        active ? " bespoke-wizard__chip--active" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="bespoke-wizard__chip-input"
                        checked={active}
                        onChange={() => setGems((prev) => toggleChip(prev, g))}
                      />
                      <span>{g}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bespoke-wizard__fields-card">
            <div className="bespoke-form__grid bespoke-form__grid--2">
              <div className="bespoke-form__field">
                <label htmlFor="bq-size">Ring size (if needed)</label>
                <input
                  id="bq-size"
                  value={ringSize}
                  onChange={(e) => setRingSize(e.target.value)}
                  placeholder="e.g. 12"
                  suppressHydrationWarning
                />
              </div>
              <div className="bespoke-form__field">
                <label htmlFor="bq-budget">Budget range *</label>
                <select
                  id="bq-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  suppressHydrationWarning
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
                  suppressHydrationWarning
                />
              </div>
              <div className="bespoke-form__field">
                <label htmlFor="bq-occasion">Occasion</label>
                <input
                  id="bq-occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="Wedding, gift…"
                  suppressHydrationWarning
                />
              </div>
            </div>
            </div>

            <div className="bespoke-form__field">
              <label htmlFor="bq-notes">Anything else?</label>
              <textarea
                id="bq-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special requests, engraving…"
                suppressHydrationWarning
              />
            </div>

            <label
              className={`bespoke-wizard__toggle-row${
                oldGold ? " bespoke-wizard__toggle-row--active" : ""
              }`}
            >
              <input
                type="checkbox"
                className="bespoke-wizard__chip-input"
                checked={oldGold}
                onChange={(e) => setOldGold(e.target.checked)}
              />
              <span className="bespoke-wizard__toggle-icon" aria-hidden>
                {oldGold ? "✓" : ""}
              </span>
              <span className="bespoke-wizard__toggle-text">
                <strong>I have old gold to exchange</strong>
                <small>We assess purity and apply value to your new piece</small>
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="bespoke-wizard__panel bespoke-wizard__review">
            <dl className="bespoke-wizard__summary">
              <div className="bespoke-wizard__summary-block">
                <dt>Contact</dt>
                <dd>
                  {name.trim()}
                  <br />
                  {email.trim()} · +91 {normalizeIndianMobile(phone) ?? phone}
                  <br />
                  {city.trim()} · via {contactVia}
                </dd>
              </div>
              <div className="bespoke-wizard__summary-block">
                <dt>Design</dt>
                <dd>
                  <strong>{jewelleryType}</strong>
                  {inspiration.trim() ? (
                    <>
                      <br />
                      {inspiration.trim()}
                    </>
                  ) : null}
                  {pendingImages.length > 0 ? (
                    <>
                      <br />
                      <span className="bespoke-wizard__summary-muted">
                        {pendingImages.length} photo
                        {pendingImages.length > 1 ? "s" : ""} will be uploaded
                      </span>
                    </>
                  ) : null}
                </dd>
              </div>
              <div className="bespoke-wizard__summary-block">
                <dt>Preferences</dt>
                <dd>
                  Budget: {budget || "—"}
                  {metals.length ? (
                    <>
                      <br />
                      Metal: {metals.join(", ")}
                    </>
                  ) : null}
                  {gems.length ? (
                    <>
                      <br />
                      Gems: {gems.join(", ")}
                    </>
                  ) : null}
                  {ringSize ? (
                    <>
                      <br />
                      Ring size: {ringSize}
                    </>
                  ) : null}
                  {requiredBy ? (
                    <>
                      <br />
                      By: {requiredBy}
                    </>
                  ) : null}
                  {occasion ? (
                    <>
                      <br />
                      Occasion: {occasion}
                    </>
                  ) : null}
                  {oldGold ? (
                    <>
                      <br />
                      Old gold exchange: Yes
                    </>
                  ) : null}
                  {notes.trim() ? (
                    <>
                      <br />
                      Notes: {notes.trim()}
                    </>
                  ) : null}
                </dd>
              </div>
            </dl>
            <p className="bespoke-wizard__review-hint">
              Tap below to open WhatsApp with your quote. Our team typically replies within 24 hours.
            </p>
          </div>
        )}

        {error ? (
          <p role="alert" className="bespoke-form__error">
            {error}
          </p>
        ) : null}

        <div className="bespoke-wizard__actions">
          {step > 0 ? (
            <button
              type="button"
              className="bespoke-wizard__btn bespoke-wizard__btn--ghost"
              onClick={goBack}
              disabled={submitting}
            >
              {BESPOKE_FORM_SECTION.backLabel}
            </button>
          ) : (
            <span aria-hidden />
          )}

          {step < STEP_COUNT - 1 ? (
            <button
              type="button"
              className="bespoke-page__btn bespoke-wizard__btn bespoke-wizard__btn--primary"
              onClick={goNext}
            >
              {BESPOKE_FORM_SECTION.nextLabel}
            </button>
          ) : (
            <button
              type="submit"
              className="bespoke-page__btn bespoke-wizard__btn bespoke-wizard__btn--primary bespoke-wizard__btn--whatsapp"
              disabled={submitting}
              suppressHydrationWarning
            >
              {submitting
                ? BESPOKE_FORM_SECTION.uploadingLabel
                : BESPOKE_FORM_SECTION.submitLabel}
            </button>
          )}
        </div>

        <div className="bespoke-form__trust">
          {BESPOKE_FORM_SECTION.trustBadges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </form>
    </div>
  );
}

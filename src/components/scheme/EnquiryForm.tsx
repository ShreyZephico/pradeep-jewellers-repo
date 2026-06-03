"use client";

import { useState } from "react";

import type { SchemeEnquiry } from "@/lib/scheme/contentTypes";

type FormFieldName =
  | "fullName"
  | "contactNumber"
  | "monthlyAmount"
  | "plan"
  | "consent";

type FormValues = {
  fullName: string;
  contactNumber: string;
  monthlyAmount: string;
  plan: string;
  consent: boolean;
};

export default function EnquiryForm({ enquiry }: { enquiry: SchemeEnquiry }) {
  const MIN_MONTHLY_INSTALLMENT = enquiry.minMonthlyInstallment ?? 2000
  const STEP_MONTHLY_INSTALLMENT = enquiry.stepMonthlyInstallment ?? 1000
  const v = enquiry.validation ?? {}

  const [values, setValues] = useState<FormValues>(() => ({
    fullName: "",
    contactNumber: "",
    monthlyAmount: "",
    plan: "",
    consent: false,
  }));

  const [touched, setTouched] = useState<
    Partial<Record<FormFieldName, boolean>>
  >(() => ({}));

  const setField = <K extends keyof FormValues>(
    name: K,
    value: FormValues[K]
  ) => {
    setValues((v) => ({ ...v, [name]: value }));
  };

  const touch = (name: FormFieldName) => {
    setTouched((t) => ({ ...t, [name]: true }));
  };

  const getField = (name: string) =>
    enquiry.fields.find((f) => f.name === name)

  const phoneDigitsRaw = (
    values.contactNumber || ''
  ).replace(/\D/g, '')

  const phoneDigits =
    phoneDigitsRaw.length === 12 &&
      phoneDigitsRaw.startsWith('91')
      ? phoneDigitsRaw.slice(2)
      : phoneDigitsRaw

  const phoneError = (() => {
    if (!values.contactNumber.trim())
      return v.contactRequired

    if (phoneDigits.length !== 10)
      return v.contactTenDigits

    if (!/^[6-9]\d{9}$/.test(phoneDigits))
      return v.contactIndian

    return null
  })()

  const errors = (() => {
    const e: Partial<Record<FormFieldName, string>> = {};

    if (phoneError) e.contactNumber = phoneError

    const name = values.fullName.trim()

    if (!name)
      e.fullName = v.nameRequired
    else if (name.length < 3)
      e.fullName = v.nameMin
    else if (
      !/^[\p{L}][\p{L}\s.'-]*$/u.test(name)
    )
      e.fullName = v.nameInvalid

    if (
      values.monthlyAmount === '' ||
      values.monthlyAmount === null
    ) {
      e.monthlyAmount =
        v.amountRequired
    } else {
      const amt = Number(values.monthlyAmount)

      if (!Number.isFinite(amt) || amt <= 0)
        e.monthlyAmount =
          v.amountInvalid
      else if (!Number.isInteger(amt))
        e.monthlyAmount =
          v.amountWhole
      else if (amt % STEP_MONTHLY_INSTALLMENT !== 0)
        e.monthlyAmount =
          v.amountStep ?? `Amount must be in multiples of ₹${STEP_MONTHLY_INSTALLMENT}.`
      else if (amt < MIN_MONTHLY_INSTALLMENT)
        e.monthlyAmount = v.amountMin
    }

    if (!values.plan)
      e.plan = v.planRequired

    if (!values.consent)
      e.consent =
        v.consentRequired

    return e
  })()

  const isValid =
    Object.keys(errors).length === 0

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setTouched((t) => ({
      ...t,
      contactNumber: true,
      fullName: true,
      monthlyAmount: true,
      plan: true,
      consent: true
    }))

    if (!isValid) return

    try {
      const res = await fetch('/api/scheme-enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: values.fullName.trim(),
          contactNumber: values.contactNumber.trim(),
          monthlyAmount: Number(values.monthlyAmount),
          plan: values.plan,
        }),
      })

      if (!res.ok) {
        throw new Error('submit failed')
      }

      alert(enquiry.submitSuccess ?? 'Form submitted successfully!')

      // RESET FORM
      setValues({
        fullName: '',
        contactNumber: '',
        monthlyAmount: '',
        plan: '',
        consent: false
      })

      setTouched({})
    } catch (error) {
      console.error(error)
      alert(enquiry.submitError ?? 'Something went wrong.')
    }
  }

  return (
    <section
      className="svy__enquiry"
      id={enquiry.id}
      aria-label={enquiry.sectionAria ?? 'Enquiry form'}
    >
      <div className="svy__enquiryInner">
        <div className="svy__sectionHeading">
          <h2 className="svy__h2">
            {enquiry.heading}
          </h2>

          <p className="svy__muted">
            {enquiry.subheading}
          </p>
        </div>

        <form
          className="svy__form"
          name="enquiry-form"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          onSubmit={onSubmit}
          noValidate
        >
          <input
            type="hidden"
            name="form-name"
            value="enquiry-form"
          />
          <input
            type="hidden"
            name="contactNumber"
            value={values.contactNumber}
          />

          {/* SPAM PROTECTION */}
          <p hidden>
            <label>
              {enquiry.honeypotLabel ?? 'Do not fill this out:'}
              <input name="bot-field" />
            </label>
          </p>

          <>
            <div className="svy__formGrid">
              <div className="svy__field">
                <label className="svy__label" htmlFor="contactNumber">
                  {getField('contactNumber')?.label ?? 'Contact Number'}
                </label>

                <input
                  className="svy__input"
                  id="contactNumber"
                  name="contactNumber"
                  type={getField('contactNumber')?.type ?? 'tel'}
                  placeholder={getField('contactNumber')?.placeholder}
                  value={values.contactNumber}
                  onChange={(e) => setField('contactNumber', e.target.value)}
                  onBlur={() => touch('contactNumber')}
                  aria-invalid={touched.contactNumber && errors.contactNumber ? 'true' : 'false'}
                />

                {touched.contactNumber && errors.contactNumber ? (
                  <p className="svy__fieldError" role="alert">
                    {errors.contactNumber}
                  </p>
                ) : null}
              </div>

                <div className="svy__field">
                  <label
                    className="svy__label"
                    htmlFor="fullName"
                  >
                    {getField('fullName')
                      ?.label ?? 'Full Name'}
                  </label>

                  <input
                    className="svy__input"
                    id="fullName"
                    name="fullName"
                    type={
                      getField('fullName')
                        ?.type ?? 'text'
                    }
                    placeholder={
                      getField('fullName')
                        ?.placeholder
                    }
                    value={values.fullName}
                    onChange={(e) =>
                      setField(
                        'fullName',
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      touch('fullName')
                    }
                    aria-invalid={
                      touched.fullName &&
                        errors.fullName
                        ? 'true'
                        : 'false'
                    }
                  />

                  {touched.fullName &&
                    errors.fullName ? (
                    <p
                      className="svy__fieldError"
                      role="alert"
                    >
                      {errors.fullName}
                    </p>
                  ) : null}
                </div>

                <div className="svy__field">
                  <label
                    className="svy__label"
                    htmlFor="monthlyAmount"
                  >
                    {getField(
                      'monthlyAmount'
                    )?.label ??
                      'Monthly Installment Amount'}
                  </label>

                  <input
                    className="svy__input"
                    id="monthlyAmount"
                    name="monthlyAmount"
                    type={
                      getField(
                        'monthlyAmount'
                      )?.type ?? 'number'
                    }
                    min={MIN_MONTHLY_INSTALLMENT}
                    step={STEP_MONTHLY_INSTALLMENT}
                    placeholder={
                      getField(
                        'monthlyAmount'
                      )?.placeholder
                    }
                    value={
                      values.monthlyAmount
                    }
                    onChange={(e) =>
                      setField(
                        'monthlyAmount',
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      touch(
                        'monthlyAmount'
                      )
                    }
                    aria-invalid={
                      touched.monthlyAmount &&
                        errors.monthlyAmount
                        ? 'true'
                        : 'false'
                    }
                  />

                  {touched.monthlyAmount &&
                    errors.monthlyAmount ? (
                    <p
                      className="svy__fieldError"
                      role="alert"
                    >
                      {errors.monthlyAmount}
                    </p>
                  ) : null}
                </div>

                <div className="svy__field">
                  <label
                    className="svy__label"
                    htmlFor="plan"
                  >
                    {getField('plan')
                      ?.label ??
                      'Select Plan'}
                  </label>

                  <select
                    className="svy__input"
                    id="plan"
                    name="plan"
                    value={values.plan}
                    onChange={(e) =>
                      setField(
                        'plan',
                        e.target.value
                      )
                    }
                    onBlur={() =>
                      touch('plan')
                    }
                    aria-invalid={
                      touched.plan &&
                        errors.plan
                        ? 'true'
                        : 'false'
                    }
                  >
                    <option
                      value=""
                      disabled
                    >
                      {getField('plan')
                        ?.options?.[0] ??
                        'Select'}
                    </option>

                    {(
                      getField('plan')
                        ?.options ?? []
                    ).map((opt) => (
                      <option
                        key={opt}
                        value={opt}
                      >
                        {opt}
                      </option>
                    ))}
                  </select>

                  {touched.plan &&
                    errors.plan ? (
                    <p
                      className="svy__fieldError"
                      role="alert"
                    >
                      {errors.plan}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="svy__consent">
                <input
                  className="svy__checkbox"
                  id={enquiry.consent.id}
                  name="consent"
                  type="checkbox"
                  value="agreed"
                  checked={values.consent}
                  onChange={(e) =>
                    setField(
                      'consent',
                      e.target.checked
                    )
                  }
                  onBlur={() =>
                    touch('consent')
                  }
                  aria-invalid={
                    touched.consent &&
                      errors.consent
                      ? 'true'
                      : 'false'
                  }
                />

                <label
                  className="svy__consentLabel"
                  htmlFor={
                    enquiry.consent.id
                  }
                >
                  {enquiry.consent.label}
                </label>
              </div>

              {touched.consent &&
                errors.consent ? (
                <p
                  className="svy__fieldError"
                  role="alert"
                >
                  {errors.consent}
                </p>
              ) : null}

              <button
                className="svy__submit"
                type="submit"
                disabled={!isValid}
              >
                {enquiry.submit.label}
              </button>
          </>
        </form>
      </div>
    </section>
  )
}

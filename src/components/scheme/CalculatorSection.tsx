"use client";

import { useMemo, useState } from "react";

import { MaterialIcon } from "@/components/scheme/shared";
import { useSchemeContent } from "@/contexts/SchemeContentContext";
import type { SchemeCalculator, SchemePlanItem } from "@/lib/scheme/contentTypes";
import { interpolate } from "@/lib/scheme/interpolate";

function formatINR(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CalculatorSection({
  calculator,
  plans,
}: {
  calculator?: SchemeCalculator;
  plans?: SchemePlanItem[];
}) {
  const { lang } = useSchemeContent()
  const locale = lang === 'gu' ? 'gu-IN' : 'en-IN'

  const minAmount = calculator?.minAmount ?? 2000
  const stepAmount = calculator?.stepAmount ?? 1000
  const [amount, setAmount] = useState<string | number>(minAmount)

  const parsedAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0
  const isValidMultiple = parsedAmount % stepAmount === 0
  const isValid = parsedAmount >= minAmount && isValidMultiple

  const rows = useMemo(() => {
    const safeAmount = isValid ? parsedAmount : minAmount
    return (plans ?? []).map((p) => {
      const paid = safeAmount * p.months
      const bonus = safeAmount * p.bonusMonths
      const total = paid + bonus
      return { ...p, paid, bonus, total }
    })
  }, [parsedAmount, isValid, minAmount, plans])

  const enteredHint =
    isValid && calculator?.enteredAmountTemplate
      ? interpolate(calculator.enteredAmountTemplate, {
          amount: formatINR(parsedAmount, locale),
        })
      : null

  return (
    <section
      className="svy__bento"
      id={calculator?.id ?? 'calculator'}
      aria-label={calculator?.sectionAria ?? 'Calculator'}
    >
      <header className="svy__sectionHeading">
        <p className="svy__kicker">{calculator?.kicker}</p>
        <h2 className="svy__h2">{calculator?.heading}</h2>
        <p className="svy__muted">{calculator?.subheading}</p>
      </header>

      <div className="svy__calcGrid">
        <div className="svy__card svy__card--tonal svy__calcInputCard">
          <div className="svy__cardTop">
            <div className="svy__iconCircle" aria-hidden="true">
              <MaterialIcon name="calculate" className="svy__iconOnCircle" />
            </div>
            <h3 className="svy__h3">{calculator?.inputTitle}</h3>
          </div>

          <div className="svy__fieldStack svy__fieldStack--calc">
            <label className="svy__field">
              <span className="svy__label">{calculator?.inputLabel}</span>
              <input
                className="svy__input"
                type="number"
                min={minAmount}
                step={stepAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${minAmount}`}
                inputMode="numeric"
              />
            </label>

            {!isValid ? (
              <p className="svy__fieldError">
                {!isValidMultiple
                  ? calculator?.invalidStep ?? `Amount must be in multiples of ₹${stepAmount}.`
                  : calculator?.invalidMin ?? `Minimum amount is ₹${minAmount}.`}
              </p>
            ) : (
              <p className="svy__muted svy__small svy__calcEnteredHint">{enteredHint}</p>
            )}
          </div>
        </div>

        <div
          className="svy__card svy__card--tonal svy__calcResultsCard"
          aria-label={calculator?.resultsAria ?? 'Calculated results'}
        >
          <h3 className="svy__h3">{calculator?.summaryTitle}</h3>
          <p className="svy__muted svy__small svy__calcFormula">{calculator?.summaryFormula}</p>

          <div className="svy__calcRows">
            {rows.map((r) => (
              <div key={r.code} className="svy__calcRow">
                <div className="svy__calcRowLeft">
                  <MaterialIcon name={r.icon} className="svy__detailIcon" />
                  <div>
                    <div className="svy__calcPlanTitle">
                      <span className="svy__calcPlanName">{r.name}</span>
                      <span className="svy__calcPill">{r.code}</span>
                    </div>
                    <div className="svy__muted svy__small">
                      {calculator?.rowPaidBonusTemplate
                        ? interpolate(calculator.rowPaidBonusTemplate, {
                            paid: formatINR(r.paid, locale),
                            bonus: formatINR(r.bonus, locale),
                          })
                        : null}
                    </div>
                  </div>
                </div>
                <div className="svy__calcTotal">{formatINR(r.total, locale)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

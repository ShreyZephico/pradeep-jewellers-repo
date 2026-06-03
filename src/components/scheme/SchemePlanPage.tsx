"use client";

import SchemePageShell from "@/components/scheme/SchemePageShell";
import { MaterialIcon, SmartLink } from "@/components/scheme/shared";
import { useSchemeContent } from "@/contexts/SchemeContentContext";
import { interpolate } from "@/lib/scheme/interpolate";

function monthWord(
  count: number,
  copy: { monthSingular?: string; monthPlural?: string }
): string {
  return count === 1
    ? (copy.monthSingular ?? "month")
    : (copy.monthPlural ?? "months");
}

export default function SchemePlanPage() {
  const { content } = useSchemeContent();
  const copy = content.plans.page.copy ?? {};

  return (
    <SchemePageShell>
      <section
        className="svy__bento"
        id="plans"
        aria-label={copy.sectionAria ?? "Plans"}
      >
        <header className="svy__sectionHeading">
          <p className="svy__kicker">{content.plans.page.kicker}</p>
          <h2 className="svy__h2">{content.plans.page.heading}</h2>
          <p className="svy__muted">{content.plans.page.subheading}</p>
        </header>

        <div className="svy__bentoGrid">
          {content.plans.items.map((plan) => {
            const totalMonths = plan.months + plan.bonusMonths;
            return (
              <article
                key={plan.code}
                className="svy__card svy__card--tonal svy__planCard"
              >
                <div>
                  <div className="svy__cardTop">
                    <div className="svy__iconCircle" aria-hidden>
                      <MaterialIcon
                        name={plan.icon}
                        className="svy__iconOnCircle"
                      />
                    </div>
                    <div>
                      <h3 className="svy__h3">{plan.name}</h3>
                      <p className="svy__muted svy__planSubtitle">
                        {interpolate(copy.planSubtitle ?? "", {
                          code: plan.code,
                          months: plan.months,
                          monthsLabel: monthWord(plan.months, copy),
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="svy__planCardText">
                    <p className="svy__muted svy__planTagline">{plan.tagline}</p>
                    <p className="svy__muted svy__planCompletion">
                      {interpolate(copy.completionLine ?? "", {
                        paidMonths: plan.months,
                        paidMonthsLabel: monthWord(plan.months, copy),
                        bonusMonths: plan.bonusMonths,
                        bonusMonthsLabel: monthWord(plan.bonusMonths, copy),
                      })}
                    </p>
                    <p className="svy__muted svy__planBenefit">
                      {copy.totalBenefitBefore}
                      <strong>
                        {totalMonths} {monthWord(totalMonths, copy)}
                      </strong>
                      {copy.totalBenefitAfter}
                    </p>
                  </div>
                </div>

                <div className="svy__planActions">
                  <SmartLink
                    className="svy__button svy__button--primary"
                    href="/scheme/enquiry"
                  >
                    {content.plans.page.ctaPrefix}
                    {plan.name}
                  </SmartLink>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </SchemePageShell>
  );
}

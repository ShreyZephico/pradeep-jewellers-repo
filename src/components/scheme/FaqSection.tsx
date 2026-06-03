"use client";
import { MaterialIcon } from './shared'

import type { SchemeFaq } from "@/lib/scheme/contentTypes";

export default function FaqSection({ faq }: { faq: SchemeFaq }) {
  if (!faq?.items?.length) return null

  return (
    <section className="svy__bento" id={faq.id} aria-label={faq.sectionAria}>
      <header className="svy__sectionHeading">
        <p className="svy__kicker">{faq.kicker}</p>
        <h2 className="svy__h2">{faq.heading}</h2>
        {faq.subheading ? <p className="svy__muted">{faq.subheading}</p> : null}
      </header>

      <div className="svy__faqList">
        {faq.items.map((item) => (
          <details key={item.question} className="svy__faqItem">
            <summary className="svy__faqSummary">
              <span className="svy__faqSummaryText">{item.question}</span>
              <MaterialIcon name="expand_more" className="svy__faqChevron" aria-hidden="true" />
            </summary>
            <p className="svy__faqAnswer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

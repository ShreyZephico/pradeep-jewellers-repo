"use client";
import type { SchemeLegalDoc } from "@/lib/scheme/contentTypes";

type LegalSection = SchemeLegalDoc["sections"][number] & {
  bullets?: string[];
  subsections?: Array<{
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
  }>;
};

function SectionBlocks({ section }: { section: LegalSection }) {
  return (
    <>
      {section.paragraphs?.map((text, i) => (
        <p key={`p-${i}`} className="svy__legalP">
          {text}
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="svy__legalUl">
          {section.bullets.map((item, i) => (
            <li key={`b-${i}`}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.subsections?.map((sub) => (
        <div key={sub.heading} className="svy__legalSubsection">
          <h3 className="svy__legalH3">{sub.heading}</h3>
          {sub.paragraphs?.map((text, i) => (
            <p key={`sp-${i}`} className="svy__legalP">
              {text}
            </p>
          ))}
          {sub.bullets?.length ? (
            <ul className="svy__legalUl">
              {sub.bullets.map((item, i) => (
                <li key={`sb-${i}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </>
  )
}

export default function LegalDocument({ doc }: { doc: SchemeLegalDoc }) {
  if (!doc) return null

  return (
    <article className="svy__legalDoc" aria-label={doc.ariaLabel}>
      <header className="svy__legalDocHeader">
        <p className="svy__kicker">{doc.kicker}</p>
        <h1 className="svy__legalDocTitle">{doc.title}</h1>
        <p className="svy__legalDocMeta">
          <span className="svy__legalDocUpdated">
            {doc.updatedLabel} {doc.updatedDate}
          </span>
        </p>
        {doc.leadParagraphs.map((text, i) => (
          <p key={`lead-${i}`} className="svy__legalDocLead">
            {text}
          </p>
        ))}
      </header>

      {doc.sections.map((section) => (
        <section key={section.id} id={section.id} className="svy__legalSection">
          <h2 className="svy__legalH2">{section.heading}</h2>
          <SectionBlocks section={section} />
        </section>
      ))}
    </article>
  )
}

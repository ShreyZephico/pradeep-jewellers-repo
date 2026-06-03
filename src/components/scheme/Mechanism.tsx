"use client";
import { MaterialIcon } from './shared'

import type { SchemeMechanism } from "@/lib/scheme/contentTypes";

export default function Mechanism({ mechanism }: { mechanism: SchemeMechanism }) {
  return (
    <section
      className="svy__bento"
      id={mechanism.id}
      aria-label={mechanism.sectionAria ?? 'Mechanism'}
    >
      <div className="svy__sectionHeading">
        <h2 className="svy__h2">{mechanism.heading}</h2>
        <p className="svy__muted">{mechanism.subheading}</p>
      </div>

      <div className="svy__bentoGrid">
        <div className="svy__card svy__card--tonal svy__card--large">
          <div className="svy__cardTop">
            <div className="svy__iconCircle">
              <MaterialIcon name={mechanism.largeStep.icon} className="svy__iconOnCircle" />
            </div>
            <h3 className="svy__h3">{mechanism.largeStep.title}</h3>
          </div>
          <p className="svy__muted svy__cardText">{mechanism.largeStep.description}</p>
          <div className="svy__cardImageFrame">
            <img
              className="svy__cardImage"
              src={mechanism.largeStep.image.src}
              alt={mechanism.largeStep.image.alt}
              loading="lazy"
            />
          </div>
        </div>

        <div className="svy__card svy__card--primary svy__card--reward">
          <div className="svy__rewardIconWrap">
            <MaterialIcon name={mechanism.rewardStep.icon} className="svy__rewardIcon" />
          </div>
          <h3 className="svy__h3 svy__h3--onPrimary">{mechanism.rewardStep.title}</h3>
          <p className="svy__onPrimaryMuted">{mechanism.rewardStep.description}</p>
        </div>

        {mechanism.details.map((d) => (
          <div key={d.title} className="svy__card svy__card--tonal">
            <MaterialIcon name={d.icon} className="svy__detailIcon" />
            <h4 className="svy__h4">{d.title}</h4>
            <p className="svy__muted svy__small">{d.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}


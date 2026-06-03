"use client";
import { MaterialIcon, SmartLink } from './shared'

import type { SchemeVisitUs } from "@/lib/scheme/contentTypes";

export default function VisitUsSection({ visitUs }: { visitUs: SchemeVisitUs }) {
  const address = visitUs?.address ?? ''
  const heading = visitUs?.heading ?? ''
  const hours = visitUs?.hours ?? ''
  const phoneDisplay = visitUs?.phoneDisplay ?? ''
  const phoneTel = visitUs?.phoneTel ?? ''
  const storeWebsite = visitUs?.storeWebsite

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  // NOTE: Use "classic" embed URL; it's more reliably iframe-embeddable than /maps?q=... forms.
  const mapsEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=17&ie=UTF8&iwloc=&output=embed`

  return (
    <section
      className="svy__bento"
      id={visitUs?.id ?? 'visit-us'}
      aria-label={visitUs?.sectionAria ?? 'Visit us'}
    >
      <header className="svy__sectionHeading">
        <p className="svy__kicker">{visitUs?.kicker}</p>
        <h2 className="svy__h2">{heading}</h2>
        <p className="svy__muted">{address}</p>
      </header>

      <div className="svy__visitGrid" aria-label={visitUs?.gridAria ?? 'Store location'}>
        <div className="svy__card svy__card--tonal svy__visitInfoCard">
          <div className="svy__visitInfoRows">
            <div className="svy__visitInfoRow">
              <MaterialIcon name="schedule" className="svy__visitInfoIcon" />
              <span className="svy__muted svy__small">{hours}</span>
            </div>
            <div className="svy__visitInfoRow">
              <MaterialIcon name="call" className="svy__visitInfoIcon" />
              <span className="svy__muted svy__small">
                {phoneDisplay}
              </span>
            </div>
          </div>

          <div className="svy__visitButtons">
            <SmartLink className="svy__button svy__button--primary" href={mapsLink}>
              {visitUs?.getDirections}
            </SmartLink>
            <SmartLink className="svy__button svy__button--secondary" href={`tel:${phoneTel}`}>
              {visitUs?.callNow}
            </SmartLink>
            {storeWebsite?.href ? (
              <SmartLink className="svy__button svy__button--secondary" href={storeWebsite.href}>
                {storeWebsite.label}
              </SmartLink>
            ) : null}
          </div>
        </div>

        <div
          className="svy__card svy__card--tonal svy__visitMapCard"
          aria-label={visitUs?.mapCardAria ?? 'Map preview'}
        >
          <div className="svy__visitMapFrame">
            <iframe
              className="svy__visitMap"
              title={visitUs?.mapIframeTitle ?? 'Store location map'}
              src={mapsEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  )
}


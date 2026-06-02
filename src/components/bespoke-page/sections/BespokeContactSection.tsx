import Image from "next/image";

import data from "@/data/contactDatas.json";

import { BESPOKE_FORM_IMAGE as BESPOKE_SHOWROOM_IMAGE } from "../content";

export default function BespokeContactSection() {
  const { contact, social, header, visit } = {
    contact: data.contact,
    social: data.social,
    header: data.header,
    visit: data.footerSection.visit,
  };

  return (
    <section
      className="bespoke-page__section"
      aria-labelledby="bespoke-contact-title"
    >
      <div className="bespoke-page__container">
        <p className="bespoke-page__eyebrow" data-reveal>
          Contact
        </p>
        <h2 id="bespoke-contact-title" className="bespoke-page__title" data-reveal>
          Visit or reach out
        </h2>
        <div className="bespoke-contact__grid">
          <div data-reveal>
            <div className="bespoke-contact__showroom">
              <Image
                src={BESPOKE_SHOWROOM_IMAGE}
                alt="Showroom"
                fill
                sizes="(max-width:768px) 100vw, 50vw"
              />
            </div>
            <div className="bespoke-contact__card">
              <h3>Visit our showroom</h3>
              <p>{visit.address}</p>
              <p>{visit.hours}</p>
              <p>
                <a href={visit.mapHref} target="_blank" rel="noopener noreferrer">
                  {visit.mapLabel}
                </a>
              </p>
            </div>
            <div className="bespoke-contact__card">
              <h3>Call us</h3>
              <p>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
              </p>
              <h3>Email</h3>
              <p>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
              <h3>WhatsApp</h3>
              <p>
                <a href={social.whatsapp} target="_blank" rel="noopener noreferrer">
                  Quick quote on WhatsApp
                </a>
              </p>
              <h3>Schedule appointment</h3>
              <p>
                <a href={header.videoCallUrl} target="_blank" rel="noopener noreferrer">
                  {header.videoCallText}
                </a>
              </p>
            </div>
          </div>
          <div className="bespoke-contact__map" data-reveal data-stagger="2">
            <iframe
              title="Store location map"
              src={visit.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

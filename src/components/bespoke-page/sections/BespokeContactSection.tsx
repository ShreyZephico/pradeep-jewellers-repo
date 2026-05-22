import Image from "next/image";

import data from "@/data/contactDatas.json";

import { BESPOKE_SHOWROOM_IMAGE } from "../content";

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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.0!2d80.22!3d13.04!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDAyJzAwLjAiTiA4MMKwMTMnMTIuMCJF!5e0!3m2!1sen!2sin!4v1"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

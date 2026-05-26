"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import notFoundData from "@/data/notFound.json";

import NotFoundIllustration from "./NotFoundIllustration";
import {
  navigateWithFullReload,
  useNotFoundFullReload,
} from "./useNotFoundFullReload";
import "./css/not-found.css";

export default function NotFoundPage() {
  const [ready, setReady] = useState(false);
  const d = notFoundData;

  useNotFoundFullReload();

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`not-found${ready ? " not-found--ready" : ""}`}>
      <main className="not-found__main" id="main-content">
        <div className="not-found__panel">
          <div className="not-found__inner">
            <div className="not-found__art">
              <NotFoundIllustration />
            </div>

            <div className="not-found__copy">
              <p className="not-found__badge">{d.badge}</p>
              <p className="not-found__code" aria-hidden>
                {d.code}
              </p>
              <h1 className="not-found__title">{d.title}</h1>
              <p className="not-found__description">{d.description}</p>
              <p className="not-found__hint">{d.hint}</p>

              <div className="not-found__actions">
                <a
                  href={d.actions.primary.href}
                  className="not-found__btn not-found__btn--primary"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateWithFullReload(d.actions.primary.href);
                  }}
                >
                  {d.actions.primary.label}
                  <span className="not-found__btn-arrow" aria-hidden>
                    →
                  </span>
                </a>
                <a
                  href={d.actions.secondary.href}
                  className="not-found__btn not-found__btn--secondary"
                >
                  {d.actions.secondary.label}
                </a>
                <a
                  href={d.actions.tertiary.href}
                  className="not-found__btn not-found__btn--tertiary"
                >
                  {d.actions.tertiary.label}
                </a>
              </div>
            </div>
          </div>

          <div className="not-found__footer-inner">
            <nav className="not-found__quick" aria-label="Helpful links">
              <p className="not-found__quick-title">Explore instead</p>
              <ul className="not-found__quick-list">
                {d.quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="not-found__quick-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="not-found__facts" aria-label="Did you know">
              {d.funFacts.map((fact) => (
                <p key={fact} className="not-found__fact">
                  {fact}
                </p>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

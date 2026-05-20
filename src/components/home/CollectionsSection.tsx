"use client";

import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";

import data from "@/data/contactDatas.json";

import "./css/collections.css";

const PRODUCTS_PATH = "/products";

/** Products page with optional search from collection name (e.g. Gold, Diamond). */
function productsHrefForCollection(title: string): string {
  const query = title
    .replace(/\s*jewellery\s*/gi, " ")
    .replace(/\(.*\)/g, "")
    .trim();

  if (!query) {
    return PRODUCTS_PATH;
  }

  return `${PRODUCTS_PATH}?q=${encodeURIComponent(query)}`;
}

export default function CollectionSection() {
  const collectionData = data.collectionSection;
  const productsPage = PRODUCTS_PATH;

  return (
    <section className="collections-section">
      <div className="collections-section__inner">
        <header className="collections-section__header">
          <div>
            <div className="collections-section__badge-row">
              <span className="collections-section__badge-line" aria-hidden />
              <p className="collections-section__badge">{collectionData.badge}</p>
            </div>

            <h2 className="collections-section__title">
              {collectionData.title}
            </h2>
          </div>

          <Link href={productsPage} className="collections-section__cta">
            {collectionData.buttonText}
            <span className="collections-section__cta-arrow" aria-hidden>
              ↗
            </span>
          </Link>
        </header>

        <div className="collections-section__grid">
          {collectionData.collections.map((item, index) => (
            <Link
              key={item.id}
              href={productsHrefForCollection(item.title)}
              className="collections-section__card"
              style={{ "--card-index": index } as CSSProperties}
              aria-label={`${item.title} — ${item.subtitle}, shop on products page`}
            >
              <div className="collections-section__card-media">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="collections-section__card-image"
                />
                <div className="collections-section__card-overlay" aria-hidden />
              </div>

              <div className="collections-section__card-body">
                <p className="collections-section__card-id">{item.id}</p>
                <h3 className="collections-section__card-title">{item.title}</h3>
                <p className="collections-section__card-subtitle">
                  {item.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

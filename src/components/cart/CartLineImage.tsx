"use client";

import { useState } from "react";

import { normalizeCartImageUrl } from "@/lib/cartImageUrl";

type CartLineImageProps = {
  src: string | null;
  alt: string;
  size?: "drawer" | "page";
  className?: string;
};

export default function CartLineImage({
  src,
  alt,
  size = "page",
  className = "",
}: CartLineImageProps) {
  const [failed, setFailed] = useState(false);
  const imageUrl = normalizeCartImageUrl(src);
  const showImage = Boolean(imageUrl) && !failed;

  const sizeClass =
    size === "page" ? "cart-line-image--page" : "cart-line-image--drawer";

  return (
    <div className={`cart-line-image ${sizeClass} ${className}`.trim()}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- cart URLs vary (Shopify, Cloudinary)
        <img
          src={imageUrl!}
          alt={alt}
          className="cart-line-image__img"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="cart-line-image__placeholder" aria-hidden>
          ✦
        </div>
      )}
    </div>
  );
}

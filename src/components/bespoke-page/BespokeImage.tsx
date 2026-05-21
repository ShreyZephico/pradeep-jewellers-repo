"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

import { BESPOKE_IMAGE_FALLBACK } from "./content";

type Props = ImageProps & {
  fallbackSrc?: string;
};

/** Next/Image with cover fit and automatic fallback when Unsplash fails */
export default function BespokeImage({
  className = "",
  fallbackSrc = BESPOKE_IMAGE_FALLBACK,
  src,
  alt,
  onError,
  ...rest
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={currentSrc}
      alt={alt}
      className={`bespoke-page__img${className ? ` ${className}` : ""}`}
      onError={(e) => {
        onError?.(e);
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}

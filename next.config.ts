import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.106"],

  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },

  env: {
    NEXT_CLOUDINARY_CLOUD_NAME:
      process.env.NEXT_CLOUDINARY_CLOUD_NAME,

    NEXT_TAWK_PROPERTY_ID:
      process.env.NEXT_TAWK_PROPERTY_ID,

    NEXT_TAWK_WIDGET_ID:
      process.env.NEXT_TAWK_WIDGET_ID,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
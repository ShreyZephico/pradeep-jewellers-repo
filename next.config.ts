import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.106"],

  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },

  env: {
    NEXT_CLOUDINARY_CLOUD_NAME:
     
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,


  },
  async headers() {
  return [
    {
      source: "/products/:slug*",
      headers: [
        {
          key: "Cache-Control",
          value: "private, no-store",
        },
      ],
    },
  ];
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
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // Next.js Server Actions default to a 1MB request body cap -- real
    // photos (especially straight from a phone) and multi-file gallery
    // uploads blow past that instantly and fail with an opaque page-load
    // error instead of a clean message. Raised to comfortably cover a
    // batch of a few photos at once.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;

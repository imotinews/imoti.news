import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // jsdom's encoding-sniffer dependency chain (html-encoding-sniffer -> @exodus/bytes)
  // ships an ESM-only file that Turbopack's bundler fails to require() when inlined
  // into the server chunk. Marking jsdom external leaves it to Node's own module
  // resolution at runtime, which handles it correctly.
  serverExternalPackages: ["jsdom"],
};

export default nextConfig;

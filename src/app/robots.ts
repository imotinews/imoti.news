import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/newsletter/resend-client";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/potvardi", "/otpisvane"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}

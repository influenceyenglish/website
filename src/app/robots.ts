import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://influenceyenglish.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/payment-success", "/payment-cancelled"],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}

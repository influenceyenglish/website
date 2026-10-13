import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://influenceyenglish.com";
  return [
    "",
    "/privacy-policy",
    "/terms",
    "/refund-policy",
    "/subscription-policy",
    "/contact",
  ].map((path) => ({
    url: new URL(path || "/", base).toString(),
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.5 : 1,
  }));
}

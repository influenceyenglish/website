import type { Metadata } from "next";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "./globals.css";
export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://influenceyenglish.com",
  ),
  title: {
    default: "Influencey English — Speak with confidence",
    template: "%s | Influencey English",
  },
  description:
    "English-speaking practice for early-career professionals. Learn through the Corrective Feedback Loop. Join for ₹499/month or ₹4,788/year.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Influencey English",
    title: "Influencey English — Find your voice",
    description:
      "A speaking-practice community for effective, emotionally intelligent and influential communication.",
  },
  twitter: { card: "summary", title: "Influencey English — Find your voice" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
        <SmoothScroll />
        <noscript>
          <style>{`.animated-word { opacity:1 !important; filter:none !important; transform:none !important; } [style*="opacity:0"] { opacity:1 !important; transform:none !important; }`}</style>
        </noscript>
      </body>
    </html>
  );
}

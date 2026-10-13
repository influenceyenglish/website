/** Confirm these operational/legal details before enabling live enrolment. */
export const business = {
  brand: "Influencey English",
  operator: "Mohamed Hashim",
  legalName: "[Legal / registered business name — confirmation required]",
  detailsConfirmed: false,
  email: "hello@influenceyenglish.com",
  phone: "+91 99476 01539",
  phoneHref: "tel:+919947601539",
  address:
    "Mohamed Hashim, S/o Abdul Jaleel, Valiyakkathodi House, Manakkalpadi, Vadakkumpuram PO, Malappuram, Kerala, 676552, India",
  deliveryPlatform:
    "[Community platform and live-session schedule — to be confirmed]",
  policyVersion: "2026-10-13-draft-1",
  updated: "13 October 2026",
  onboardingBusinessDays: 2,
  refundRequestDays: 7,
  refundReviewBusinessDays: 2,
  refundProcessingBusinessDays: "5–7",
  cancellationBusinessDays: 2,
} as const;
export const policyLinks = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Refund policy", href: "/refund-policy" },
  { label: "Subscription policy", href: "/subscription-policy" },
  { label: "Contact", href: "/contact" },
] as const;

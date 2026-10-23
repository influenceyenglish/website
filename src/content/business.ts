/** Confirm these operational/legal details before enabling live enrolment. */
export function getBusinessDetails() {
  const legalName =
    process.env.BUSINESS_LEGAL_NAME?.trim() ||
    "VALIYAKKATHODI MOHAMMED KOYA MOHAMED HASHIM THANGAL";
  const deliveryPlatform =
    process.env.BUSINESS_DELIVERY_PLATFORM?.trim() ||
    "Access is through the Influency English community. Live speaking and practice sessions are conducted online; session timings are shared with members after joining.";
  return {
    legalName,
    deliveryPlatform,
    detailsConfirmed:
      (process.env.BUSINESS_DETAILS_CONFIRMED ?? "true") === "true" &&
      !legalName.includes("[") &&
      !deliveryPlatform.includes("["),
  };
}

const details = getBusinessDetails();
export const business = {
  brand: "Influency English",
  operator: "Mohamed Hashim",
  type: "Individual",
  razorpayBrand: "MOHAMED HASHIM",
  ...details,
  email: "hello@influenceyenglish.com",
  phone: "+91 99476 01539",
  phoneHref: "tel:+919947601539",
  address:
    "Mohamed Hashim, S/o Abdul Jaleel, Valiyakkathodi House, Manakkalpadi, Vadakkumpuram PO, Malappuram, Kerala, 676552, India",
  policyVersion: details.detailsConfirmed
    ? "2026-10-22-1"
    : "2026-10-13-draft-1",
  updated: details.detailsConfirmed ? "22 October 2026" : "13 October 2026",
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

import type { Metadata } from "next";
import { business } from "@/content/business";
import { DocumentShell } from "@/components/legal/DocumentShell";
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Influencey English for membership, billing, cancellation or privacy support.",
  alternates: { canonical: "/contact" },
};
export default function ContactPage() {
  return (
    <DocumentShell
      title="Let’s talk."
      description="Questions about practice, joining or a payment? Contact Influencey English directly."
    >
      <section>
        <h2>Membership & support</h2>
        <p>
          <a href={`mailto:${business.email}`}>{business.email}</a>
        </p>
        <p>
          <a href={business.phoneHref}>{business.phone}</a>
        </p>
        <p>
          We aim to acknowledge support, cancellation and refund requests within
          2 business days. Please include the email used at checkout and your
          subscription/payment reference. Never send card details, a UPI PIN or
          an OTP.
        </p>
      </section>
      <section>
        <h2>Business & correspondence</h2>
        <p>Operated by {business.operator}.</p>
        <p>Legal/business name: {business.legalName}</p>
        <address>{business.address}</address>
      </section>
      <section>
        <h2>Online delivery</h2>
        <p>
          Access instructions are sent to the checkout email within{" "}
          {business.onboardingBusinessDays} business days after a full
          membership payment is verified. No physical shipping.
        </p>
        <p>
          Final community platform and session schedule:{" "}
          {business.deliveryPlatform}. These will be confirmed before live
          enrolment.
        </p>
      </section>
    </DocumentShell>
  );
}

import { business } from "./business";
export type PolicySection = { heading: string; paragraphs: readonly string[] };
export type PolicyDocument = {
  title: string;
  description: string;
  sections: readonly PolicySection[];
};
const contact = `Contact ${business.operator} at ${business.email} or ${business.phone}. Correspondence address: ${business.address}. Legal/business name: ${business.legalName}.`;
export const policies = {
  "privacy-policy": {
    title: "Privacy policy",
    description:
      "How Influency English handles contact, membership and payment-related information.",
    sections: [
      {
        heading: "Who handles your information",
        paragraphs: [
          contact,
          ...(business.detailsConfirmed
            ? []
            : [
                "These policies are drafts pending confirmation of the legal/business name and the service delivery platform.",
              ]),
        ],
      },
      {
        heading: "Information we collect",
        paragraphs: [
          "When you contact us or start checkout, we collect your name, email and mobile number. Subscription identifiers, payment status, billing periods, policy consent and security/rate-limit records are stored to operate membership and investigate payment issues.",
          "Razorpay processes payment details in its checkout. We do not collect or store full card numbers, CVV, UPI PINs or banking passwords. Never send these to support.",
        ],
      },
      {
        heading: "How we use and share information",
        paragraphs: [
          "We use your information to respond to enquiries, verify payments, provide onboarding and access, manage renewals/refunds, prevent abuse and meet record-keeping requirements. It is shared only as needed with payment, hosting, storage and community-delivery providers. We do not sell member data.",
          "Razorpay and your payment provider have their own privacy terms. Community access instructions and session timings are shared after joining. Marketing consent must be separate from membership and can be withdrawn.",
        ],
      },
      {
        heading: "Cookies and security",
        paragraphs: [
          "A secure, HTTP-only checkout-session cookie connects payment verification to the browser that began checkout. Essential session storage may be used to prevent duplicate checkout attempts. Razorpay may set its own checkout cookies. We use Vercel Analytics to understand website usage.",
          "Access to records must be restricted to authorised operators. Payment secrets remain on the server. No method of electronic storage can be guaranteed completely secure.",
        ],
      },
      {
        heading: "Retention and your requests",
        paragraphs: [
          "We retain membership, transaction and consent records only for service, dispute, security and applicable record-keeping needs. Community recordings or student stories require separate, specific consent before publication.",
          "Email us to request access, correction or deletion of your personal information, or to raise a privacy concern. We aim to acknowledge requests within 2 business days. Some transaction records may need to be retained where required by law.",
        ],
      },
      {
        heading: "Adults and changes",
        paragraphs: [
          "Paid membership is for people aged 18 and above. We do not knowingly enrol children. Material changes to the service or privacy terms will be communicated through the member contact channel.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    description:
      "Membership scope, delivery, participation and service terms for Influency English.",
    sections: [
      {
        heading: "Service provider",
        paragraphs: [
          contact,
          ...(business.detailsConfirmed
            ? []
            : [
                "Legal/business name, final delivery platform and live-session schedule must be confirmed before live subscriptions are enabled.",
              ]),
        ],
      },
      {
        heading: "What you are subscribing to",
        paragraphs: [
          "Influency English is an online English-speaking practice community, primarily designed for people beginning their careers, with a focus on men. Both plans include public-speaking practice, weekly mastermind discussions, communication courses/resources, speaker-identity training, live public-speaking opportunities, corrective feedback and community support.",
          "The Corrective Feedback Loop (CFL) uses speaking, feedback, correction and repetition. It is inspired by natural learning through interaction. Participation may help develop communication skills; we do not guarantee fluency by a deadline, employment, promotion or other results. Student story placeholders are not testimonials.",
        ],
      },
      {
        heading: "Price and eligibility",
        paragraphs: [
          "You must be at least 18 and provide accurate contact information. The monthly plan is ₹499 per month; the yearly plan is ₹4,788 in one yearly payment, in INR. The yearly plan saves ₹1,200 compared with 12 monthly payments (about 20% off). These are the total membership prices; we add no separate checkout fee.",
          "Recurring billing requires explicit authorisation through Razorpay. Billing, mandate duration and cancellation are described in the subscription policy. Terms and price changes require notice and any consent required by your payment provider.",
        ],
      },
      {
        heading: "Online delivery",
        paragraphs: [
          `After a full membership payment is independently verified, onboarding instructions and community access details will be sent to your checkout email within ${business.onboardingBusinessDays} business days. There is no physical shipping.`,
          `Delivery platform/schedule: ${business.deliveryPlatform}. You need an internet connection, a device with microphone and access to the disclosed platform. No exact number of public-speaking opportunities is promised.`,
          "If access instructions do not arrive, contact support with your payment reference. Session changes will be communicated; missed sessions are not automatically refundable. Recording availability, if any, will be stated separately.",
        ],
      },
      {
        heading: "Participation and intellectual property",
        paragraphs: [
          "Treat members respectfully. Harassment, impersonation, discriminatory abuse and sharing another person’s private information are not allowed. Do not record or publish a session or member story without permission. We may restrict access for serious or repeated misconduct after reviewing the circumstances.",
          "Resources are licensed for your personal membership use. Do not resell, redistribute or share paid resources or access credentials without permission.",
        ],
      },
      {
        heading: "Cancellation, refunds and concerns",
        paragraphs: [
          "Read the refund and subscription policies before authorising payment. Cancellation stops future renewal and ordinarily preserves access through the paid period. A checkout dismissal or redirect does not by itself cancel an existing mandate.",
          "Nothing in these terms removes rights that cannot be excluded under applicable law. Contact support first if there is a service or billing concern.",
        ],
      },
    ],
  },
  "refund-policy": {
    title: "Refund policy",
    description:
      "Refund eligibility, requests and processing timelines for Influency English.",
    sections: [
      {
        heading: "Provisional terms",
        paragraphs: [
          "These are proposed operational terms requiring owner confirmation before live enrolment. They apply to the online community membership, with no physical product returns.",
          contact,
        ],
      },
      {
        heading: "First membership payment",
        paragraphs: [
          `You may request a full refund of your first monthly or yearly membership payment within ${business.refundRequestDays} calendar days of the successful payment. Email support from the checkout email and include the payment/subscription reference and reason for your request. A reason helps us improve; it does not remove eligibility within this first-payment window.`,
        ],
      },
      {
        heading: "Renewals and billing errors",
        paragraphs: [
          "A renewal is not covered by the first-payment change-of-mind window. Duplicate charges, an incorrect amount, non-delivery of the paid service, or a renewal charged after a timely cancellation request will be reviewed for an appropriate refund. Report billing issues promptly; applicable consumer rights are unaffected.",
          "Cancelling a subscription is separate from requesting a refund. Cancelling does not automatically refund a completed payment or stop a refund request already being reviewed.",
        ],
      },
      {
        heading: "Review and payment timelines",
        paragraphs: [
          `We aim to acknowledge and review a complete request within ${business.refundReviewBusinessDays} business days. Approved refunds are initiated to the original payment method within ${business.refundProcessingBusinessDays} business days of approval. Your bank or payment provider may take additional time to display the credit.`,
          "We will communicate approval or rejection and the reason by email. We do not ask for your card credentials, UPI PIN or OTP to issue a refund. A refunded billing period no longer provides membership access.",
        ],
      },
    ],
  },
  "subscription-policy": {
    title: "Subscription & cancellation policy",
    description:
      "Recurring billing, AutoPay, delivery and cancellation terms for the community.",
    sections: [
      {
        heading: "Plans and renewal",
        paragraphs: [
          "Monthly: ₹499 charged every month. Yearly: ₹4,788 charged every year in one payment. Twelve monthly payments total ₹5,988, so the annual plan saves ₹1,200 (about 20% off). Both plans include the same benefits.",
          "When you authorise AutoPay/recurring payment in Razorpay Checkout, charges recur at the chosen interval until cancellation, completion or expiry of the mandate. The prepared plans allow up to 120 monthly or 10 yearly billing cycles (10 years); after that a new authorisation is needed. There is no free trial or additional upfront fee in this offer.",
        ],
      },
      {
        heading: "Authorisation is not full membership payment",
        paragraphs: [
          "Depending on the payment method, your bank may ask you to authorise a mandate. A small authorisation amount, a checkout success message or a redirect alone is not proof that the membership fee was paid. Access is granted only for a verified full membership payment and its paid billing period.",
          "Failed, pending or halted payments do not create a new paid access period. We will not ask you to authorise an undisclosed charge. Your bank/payment provider’s notices and mandate terms also apply.",
        ],
      },
      {
        heading: "How to cancel",
        paragraphs: [
          `Email ${business.email} from your checkout email or call ${business.phone} with your subscription reference. We aim to action cancellation requests within ${business.cancellationBusinessDays} business days and send confirmation. Please request cancellation at least 2 business days before the next billing date to allow processing.`,
          "Cancellation is normally scheduled for the end of the current paid period, so you retain paid access until then and future renewal stops. If a payment method also lets you revoke its mandate in your bank/app, notify support so the subscription record can be reconciled.",
          "Closing Checkout, visiting /payment-cancelled, deleting an app or leaving the community does not itself cancel an existing subscription. Contact support if you do not receive confirmation. A charge taken after a timely cancellation request is reviewed under the refund policy.",
        ],
      },
      {
        heading: "Access and service delivery",
        paragraphs: [
          `The service is delivered online. Onboarding instructions and access details are sent within ${business.onboardingBusinessDays} business days after a full payment is verified. Platform and session schedule: ${business.deliveryPlatform}.`,
          "There is no physical shipment. Access ends after the paid period unless another valid payment renews it; a refund revokes access for the refunded period. Resources and live participation are subject to the terms of service.",
        ],
      },
      {
        heading: "Support and changes",
        paragraphs: [
          contact,
          "We will provide notice of material price/service changes and obtain fresh payment authorisation where required. Refunds are handled under the refund policy.",
        ],
      },
    ],
  },
} satisfies Record<string, PolicyDocument>;
export type PolicyKey = keyof typeof policies;
export function isPolicyKey(value: string): value is PolicyKey {
  return Object.prototype.hasOwnProperty.call(policies, value);
}

import "server-only";

// Charge amounts and mandate limits never enter the browser bundle.
// Razorpay plans are fetched and checked against these server expectations.
export const paymentPlans = {
  monthly: { amount: 49_900, period: "monthly", totalCount: 120 },
  yearly: { amount: 499_900, period: "yearly", totalCount: 10 },
} as const;

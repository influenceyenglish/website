import type { Metadata } from "next";
import { DocumentShell } from "@/components/legal/DocumentShell";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
  alternates: { canonical: "/payment-success" },
};
export default function PaymentSuccessPage() {
  return (
    <DocumentShell
      title="Your payment status."
      description="Only verified server records can confirm a paid membership period."
    >
      <PaymentStatus />
    </DocumentShell>
  );
}

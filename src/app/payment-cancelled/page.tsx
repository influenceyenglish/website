import type { Metadata } from "next";
import Link from "next/link";
import { DocumentShell } from "@/components/legal/DocumentShell";
export const metadata: Metadata = {
  title: "Checkout not completed",
  robots: { index: false, follow: false },
};
export default function PaymentCancelledPage() {
  return (
    <DocumentShell
      title="Take your time."
      description="Checkout was closed or not completed. This does not cancel an existing subscription or AutoPay mandate."
    >
      <section>
        <h2>If money was debited</h2>
        <p>
          A bank debit can be pending even if checkout closes. Check your
          Razorpay reference or contact support before making another payment.
          Do not assume the payment failed from this page alone.
        </p>
        <Link href="/payment-success">Check payment status</Link>
        <Link href="/#pricing">Return to membership</Link>
        <Link href="/contact">Get help or request cancellation</Link>
      </section>
    </DocumentShell>
  );
}

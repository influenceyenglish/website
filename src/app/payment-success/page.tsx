import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/sections/Footer";
import shellStyles from "@/components/legal/DocumentShell.module.css";
import styles from "./PaymentSuccess.module.css";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
export const metadata: Metadata = {
  title: "Payment status",
  robots: { index: false, follow: false },
  alternates: { canonical: "/payment-success" },
};
export default function PaymentSuccessPage() {
  return (
    <>
      <header className={`${shellStyles.header} ${styles.header}`}>
        <Link href="/">Influency English</Link>
      </header>
      <main id="main-content" className={styles.main}>
        <PaymentStatus />
      </main>
      <Footer />
    </>
  );
}

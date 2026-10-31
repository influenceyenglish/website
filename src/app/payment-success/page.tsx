import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
        <Link href="/" aria-label="Influencey English home">
          <Image
            src="/images/influencey-english.svg"
            alt="Influencey English"
            width={574}
            height={329}
            className={styles.logo}
            unoptimized
          />
        </Link>
      </header>
      <main id="main-content" className={styles.main}>
        <PaymentStatus />
      </main>
      <Footer />
    </>
  );
}

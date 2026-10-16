import Link from "next/link";
import { site } from "@/content/site";
import { business } from "@/content/business";
import { AnimatedText } from "@/components/motion/AnimatedText";
import { CheckIcon } from "@/components/ui/Icons";
import styles from "./Pricing.module.css";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
export function Pricing() {
  return (
    <section id="pricing" className={styles.pricing}>
      <div className={styles.pricingHeader}>
        {/* <p className="eyebrow">Invest in your voice</p> */}
        <AnimatedText>{"One membership. Step into it"}</AnimatedText>
        <p>
          Clear INR pricing. Get access to everything below mentioned, cancel
          whenever you want.
        </p>
      </div>
      <div className={styles.pricingCard}>
        <div className={styles.priceSummary}>
          <CheckoutForm
            mode={process.env.RAZORPAY_MODE === "live" ? "live" : "test"}
          />
          <p className={styles.billingNote}>
            Online access details within {business.onboardingBusinessDays}{" "}
            business days of verified full payment.{" "}
            <Link href="/subscription-policy">Delivery &amp; cancellation</Link>{" "}
            · <Link href="/refund-policy">Refund terms</Link>
          </p>
        </div>
        <ul className={styles.includes}>
          {site.includes.map((item) => (
            <li key={item}>
              <CheckIcon />
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.policyNote}>
        Policy details are provisional until the legal/business name and
        delivery schedule are confirmed. No live payment is enabled.
      </p>
    </section>
  );
}

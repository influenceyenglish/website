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
        <p className="eyebrow">Invest in your voice</p>
        <AnimatedText>
          {"Same community.\nYour choice of commitment."}
        </AnimatedText>
        <p>Clear INR pricing. All seven membership benefits in either plan.</p>
      </div>
      <div className={styles.pricingCard}>
        <div className={styles.priceSummary}>
          <CheckoutForm
            mode={process.env.RAZORPAY_MODE === "live" ? "live" : "test"}
          />
          <p className={styles.billingNote}>
            Recurring membership: ₹500 every month or ₹5,000 every year after
            AutoPay authorisation, until cancelled or the mandate expires. The
            yearly plan is billed in one payment. No additional fee is added by
            us at checkout.
          </p>
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

"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { plans, type PlanKey } from "@/content/site";
import { loadRazorpay, type CheckoutResponse } from "./razorpay";
import styles from "./Checkout.module.css";

type Created = {
  requestId: string;
  subscriptionId: string;
  keyId: string;
  mode: "test" | "live";
  plan: PlanKey;
};
async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Payment request could not be completed.");
  return data as T;
}
function attemptId(plan: PlanKey, email: string) {
  const key = `ie_checkout_${plan}_${email.toLowerCase()}`;
  const existing = sessionStorage.getItem(key);
  const id = existing || crypto.randomUUID();
  sessionStorage.setItem(key, id);
  sessionStorage.setItem("ie_latest_attempt", id);
  return id;
}

export function CheckoutForm({ mode = "test" }: { mode?: "test" | "live" }) {
  const [plan, setPlan] = useState<PlanKey>("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  const router = useRouter();
  const selected = plans[plan];
  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("Loading secure checkout…");
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim(),
      email = String(data.get("email") || "").trim(),
      phone = String(data.get("phone") || "").replace(/[\s()-]/g, "");
    let verificationStarted = false;
    const unlock = () => {
      locked.current = false;
      setBusy(false);
    };
    try {
      await loadRazorpay();
      const requestId = attemptId(plan, email);
      setMessage("Preparing your subscription…");
      const created = await post<Created>("/api/razorpay/create-subscription", {
        requestId,
        plan,
        name,
        email,
        ...(phone ? { phone } : {}),
        consent: data.get("consent") === "on",
      });
      if (!window.Razorpay)
        throw new Error("Checkout is unavailable. Please try again.");
      const handler = async (response: CheckoutResponse) => {
        verificationStarted = true;
        setMessage("Confirming your payment securely…");
        try {
          await post("/api/razorpay/verify", { requestId, ...response });
          router.push("/payment-success");
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Payment verification is pending. Please contact support before paying again.",
          );
          setMessage(
            "If money was debited, check your payment status before retrying.",
          );
        } finally {
          unlock();
        }
      };
      const razorpay = new window.Razorpay({
        key: created.keyId,
        subscription_id: created.subscriptionId,
        name: "Influencey English",
        description: `${selected.label} English-speaking community · ${selected.displayPrice}/${selected.cadence}${created.mode === "test" ? " · TEST MODE" : ""}`,
        prefill: { name, email, ...(phone ? { contact: phone } : {}) },
        theme: { color: "#043b6b" },
        handler: (response) => {
          void handler(response);
        },
        modal: {
          ondismiss: () => {
            if (!verificationStarted) {
              unlock();
              router.push("/payment-cancelled");
            }
          },
        },
        retry: { enabled: false },
      });
      razorpay.on("payment.failed", () => {
        setError(
          "The payment could not be completed. If money was debited, check your payment status or contact support before trying again.",
        );
        setMessage("");
      });
      setMessage("Complete authorisation in Razorpay Checkout.");
      razorpay.open();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout could not be started. Please contact support.",
      );
      setMessage("");
      unlock();
    }
  }
  return (
    <form id="join" className={styles.form} onSubmit={checkout}>
      <div className={styles.planHeader}>
        <p className={styles.choose}>Choose</p>
        <fieldset disabled={busy} className={styles.plans}>
          <legend>Choose your billing plan</legend>
          {Object.values(plans).map((option) => (
            <label key={option.id} className={styles.plan}>
              <input
                type="radio"
                name="plan"
                value={option.id}
                checked={plan === option.id}
                onChange={() => setPlan(option.id)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <div className={styles.priceRow}>
        <p className={styles.price} aria-live="polite">
          <strong>{selected.monthlyEquivalent}</strong>
          <span>/ month</span>
        </p>
        <span className={styles.savings}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20 3h-7L3 13l8 8L21 11V4a1 1 0 0 0-1-1Zm-3 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
          </svg>
          Save ₹1,200 with yearly
        </span>
      </div>
      <p className={styles.planNote}>
        {plan === "yearly"
          ? "₹4,788 billed annually. Save ₹1,200 a year — about 20% off."
          : "Join live speaking practice and grow with the community."}{" "}
        <Link href="/refund-policy">View refund terms</Link>.
      </p>
      <div className={styles.detailsCard}>
        <div className={styles.fields}>
          <label>
            <span>
              Full name <b aria-hidden="true">*</b>
            </span>
            <span className={styles.inputWrap}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="7" r="4" />
                <path d="M4 22v-3a8 8 0 0 1 16 0v3Z" />
              </svg>
              <input
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                required
                minLength={2}
                maxLength={80}
                disabled={busy}
              />
            </span>
          </label>
          <label>
            <span>
              Mobile number <b aria-hidden="true">*</b>
            </span>
            <span className={styles.inputWrap}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.6 2 3 3.5C1 12 12 23 20.5 21l1.5-3.6-5-3-2.2 2.2a15 15 0 0 1-7.4-7.4L9.6 7 6.6 2Z" />
              </svg>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                required
                maxLength={20}
                disabled={busy}
              />
            </span>
          </label>
          <label>
            <span>
              Email address <b aria-hidden="true">*</b>
            </span>
            <span className={styles.inputWrap}>
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m3 6 9 7 9-7" />
              </svg>
              <input
                name="email"
                type="email"
                aria-label="Email for membership access"
                autoComplete="email"
                placeholder="you@example.com"
                required
                maxLength={254}
                disabled={busy}
              />
            </span>
          </label>
        </div>
        <label className={styles.consent}>
          <input type="checkbox" name="consent" required disabled={busy} />
          <span>
            I am 18+ and agree to the{" "}
            <Link href="/terms" target="_blank" rel="noopener">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy-policy" target="_blank" rel="noopener">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/refund-policy" target="_blank" rel="noopener">
              Refund
            </Link>{" "}
            and{" "}
            <Link href="/subscription-policy" target="_blank" rel="noopener">
              Subscription policies
            </Link>
            .
          </span>
        </label>
        <p className={styles.autopay}>
          By continuing, you authorize AutoPay. {selected.displayPrice} will be
          charged {selected.period} after authorisation until cancelled or the
          mandate expires. Cancel anytime.
          {plan === "yearly" && " ₹4,788 is charged in one yearly payment."}
        </p>
        <button
          className={styles.submit}
          type="submit"
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Please wait…" : "Continue to payment"}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 12h16m-6-6 6 6-6 6" />
          </svg>
        </button>
        <p className={styles.secure}>
          <svg
            width="16"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="5" y="10" width="14" height="12" rx="2" />
            <path d="M8 10V6a4 4 0 0 1 8 0v4" />
          </svg>
          Secure checkout. Cancel anytime.
        </p>
        <p className={styles.mode}>
          {mode === "test"
            ? "Test Mode · No real payment or real community access."
            : "Secure recurring payment through Razorpay."}
        </p>
        <p role="status" aria-live="polite" className={styles.status}>
          {message}
        </p>
        {error && (
          <div role="alert" className={styles.error}>
            <p>{error}</p>
            <Link href="/payment-success">Check payment status</Link>
            <span> · </span>
            <Link href="/contact">Contact support</Link>
          </div>
        )}
        <noscript>
          <p>
            JavaScript is required for secure online checkout. Contact
            hello@influenceyenglish.com for help.
          </p>
        </noscript>
      </div>
    </form>
  );
}

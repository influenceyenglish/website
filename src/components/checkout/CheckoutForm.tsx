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
        theme: { color: "#042d2b" },
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
      <fieldset disabled={busy} className={styles.plans}>
        <legend>Choose your billing plan</legend>
        {Object.values(plans).map((option) => (
          <label
            key={option.id}
            className={`${styles.plan} ${plan === option.id ? styles.selected : ""}`}
          >
            <input
              type="radio"
              name="plan"
              value={option.id}
              checked={plan === option.id}
              onChange={() => setPlan(option.id)}
            />
            <span>{option.label}</span>
            <strong>
              {option.displayPrice}
              <small>/{option.cadence}</small>
            </strong>
            <span>
              {option.id === "yearly"
                ? "Two months free · Save ₹1,000/year"
                : "A month of guided speaking practice"}
            </span>
          </label>
        ))}
      </fieldset>
      <div className={styles.fields}>
        <label>
          Full name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            disabled={busy}
          />
        </label>
        <label>
          Email for membership access
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            disabled={busy}
          />
        </label>
        <label>
          Phone <span>(optional)</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+91"
            maxLength={20}
            disabled={busy}
          />
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
            Privacy
          </Link>
          ,{" "}
          <Link href="/refund-policy" target="_blank" rel="noopener">
            Refund
          </Link>{" "}
          and{" "}
          <Link href="/subscription-policy" target="_blank" rel="noopener">
            Subscription policies
          </Link>
          . I understand that {selected.displayPrice} is charged every{" "}
          {selected.cadence} after AutoPay authorisation until cancelled or the
          mandate expires.{" "}
          {plan === "yearly" ? "₹5,000 is charged in one yearly payment." : ""}
        </span>
      </label>
      <p className={styles.mode}>
        {mode === "test"
          ? "Test Mode · No real payment or real community access."
          : "Secure recurring payment through Razorpay."}
      </p>
      <button
        className={`button ${styles.submit}`}
        type="submit"
        disabled={busy}
        aria-busy={busy}
      >
        {busy
          ? "Please wait…"
          : `${mode === "test" ? "Try test checkout" : "Join"} · ${selected.displayPrice}/${selected.cadence}`}
      </button>
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
    </form>
  );
}

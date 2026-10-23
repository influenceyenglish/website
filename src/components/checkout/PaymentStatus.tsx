"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import styles from "@/app/payment-success/PaymentSuccess.module.css";

type Status = {
  status: "active" | "not_active" | "awaiting_full_payment" | "pending";
  paidUntil: string | null;
  mode: "test" | "live";
  studentName?: string;
};
function communityInvite() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "");
    return url.protocol === "https:" && url.hostname === "chat.whatsapp.com"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function PaymentStatus() {
  const [result, setResult] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const check = useCallback(async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const requestId = sessionStorage.getItem("ie_latest_attempt");
      if (!requestId)
        throw new Error(
          "No checkout reference was found in this browser. A URL or redirect alone cannot confirm payment.",
        );
      const response = await fetch(
        `/api/razorpay/verify?requestId=${encodeURIComponent(requestId)}`,
        { cache: "no-store", signal: AbortSignal.timeout(15000) },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Payment status could not be checked.");
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment status is temporarily unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void check();
  }, [check]);

  // A redirect or a checkout callback never selects this state. The session-bound
  // API reads the subscription's paid period from the verified server record.
  const paid = !loading && !error && result?.status === "active";
  const invite = communityInvite();
  const studentName =
    typeof result?.studentName === "string" ? result.studentName.trim() : "";
  return (
    <section className={styles.content} aria-live="polite" aria-busy={loading}>
      <p className={styles.eyebrow}>Influency English</p>
      <div className={styles.icon} aria-hidden="true">
        <svg
          width="38"
          height="38"
          viewBox="0 0 40 40"
          fill="none"
          focusable="false"
        >
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {paid ? (
            <path
              d="m12 20 5.5 5.5L28 15"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M20 11v10m0 6v1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
      <h1 className={styles.heading}>
        {loading
          ? "Checking your payment..."
          : paid
            ? "Your payment has been received"
            : result?.status === "not_active"
              ? "Your membership is not active"
              : "Payment verification is pending"}
      </h1>
      {paid ? (
        <>
          <p className={styles.greeting}>
            {studentName ? `Hi, ${studentName},` : "Hi there,"}
          </p>
          <p className={styles.description}>
            Your membership payment was verified successfully. You can now
            request access to our private WhatsApp community.
          </p>
          {invite ? (
            <a
              className={styles.cta}
              href={invite}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join WhatsApp Community <span aria-hidden="true">&rarr;</span>
            </a>
          ) : (
            <p className={styles.description}>
              The community invite is being prepared.{" "}
              <Link href="/contact">Contact support</Link> for access.
            </p>
          )}
          <p className={styles.note}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 11v6m0-10v1"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <span>
              Community access is subject to admin approval. Please join using
              the same WhatsApp number used during registration.
            </span>
          </p>
          {result?.mode === "test" && (
            <p className={styles.testMode}>
              Test Mode &middot; No real payment was taken.
            </p>
          )}
        </>
      ) : (
        <>
          {loading && (
            <p className={styles.description}>
              Please wait while we securely confirm your membership payment.
            </p>
          )}
          {error && (
            <p className={styles.description} role="alert">
              {error}
            </p>
          )}
          {!loading && result?.status === "awaiting_full_payment" && (
            <p className={styles.description}>
              Checkout authorisation was verified, but a full membership payment
              has not yet been confirmed. A mandate or small authorisation
              charge does not activate membership.
            </p>
          )}
          {!loading && result?.status === "pending" && (
            <p className={styles.description}>
              Payment confirmation has not arrived yet. If you were charged,
              allow a moment and check again. Contact support before making
              another payment.
            </p>
          )}
          {!loading && result?.status === "not_active" && (
            <p className={styles.description}>
              There is no current paid access period for this checkout. It may
              have expired or been refunded. Contact support for help.
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              disabled={loading}
              onClick={() => void check()}
            >
              Check again
            </button>
            <Link href="/contact">Contact support</Link>
          </div>
        </>
      )}
    </section>
  );
}

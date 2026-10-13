"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
type Status = {
  status: "active" | "not_active" | "awaiting_full_payment" | "pending";
  paidUntil: string | null;
  mode: "test" | "live";
};
export function PaymentStatus() {
  const [result, setResult] = useState<Status | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const check = useCallback(async () => {
    setLoading(true);
    setError("");
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
  return (
    <section aria-live="polite">
      <h2>
        {loading
          ? "Checking your payment…"
          : result?.status === "active"
            ? result.mode === "test"
              ? "Test payment verified"
              : "Payment verified"
            : "Verification comes first"}
      </h2>
      {error && <p role="alert">{error}</p>}
      {result?.status === "active" && (
        <>
          <p>
            {result.mode === "test"
              ? "This is a Test Mode result. No real payment was taken and no real community access is being delivered."
              : "Your full membership payment has been verified. Onboarding instructions and access details will be sent to your checkout email within 2 business days."}
          </p>
          {result.paidUntil && (
            <p>
              Verified paid period ends:{" "}
              {new Intl.DateTimeFormat("en-IN", {
                dateStyle: "long",
                timeZone: "Asia/Kolkata",
              }).format(new Date(result.paidUntil))}
              .
            </p>
          )}
        </>
      )}
      {result?.status === "awaiting_full_payment" && (
        <p>
          Checkout authorisation was verified, but a full membership payment has
          not yet been confirmed. A mandate or small authorisation charge does
          not activate membership.
        </p>
      )}
      {result?.status === "pending" && (
        <p>
          Payment confirmation has not arrived yet. If you were charged, allow a
          moment and check again. Contact support before making another payment.
        </p>
      )}
      {result?.status === "not_active" && (
        <p>
          There is no current paid access period for this checkout. It may have
          expired or been refunded. Contact support for help.
        </p>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <button
          className="button"
          type="button"
          disabled={loading}
          onClick={() => void check()}
        >
          Check again
        </button>
        <Link href="/contact">Contact support</Link>
        <Link href="/#pricing">Return to membership</Link>
      </div>
    </section>
  );
}

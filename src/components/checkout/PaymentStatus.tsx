"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VideoPlayer } from "@/components/VideoPlayer";
import { communityInvite } from "@/lib/community";
import { joiningTutorialVideo } from "@/content/onboarding";
import styles from "@/app/payment-success/PaymentSuccess.module.css";

type Status = {
  status:
    "active" | "not_active" | "awaiting_full_payment" | "pending" | "failed";
  paidUntil: string | null;
  mode: "test" | "live";
};
export function PaymentStatus() {
  const [result, setResult] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoChecking, setAutoChecking] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = Date.now() + 60_000;
    let checks = 0;
    setLoading(true);
    setError("");
    setResult(null);
    setAutoChecking(true);
    async function check() {
      try {
        const requestId = sessionStorage.getItem("ie_latest_attempt");
        if (!requestId) {
          if (!cancelled) {
            setError("We couldn't find this checkout. Contact us if you paid.");
            setAutoChecking(false);
            setLoading(false);
          }
          return;
        }
        const response = await fetch(
          `/api/razorpay/verify?requestId=${encodeURIComponent(requestId)}`,
          {
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(8000),
            ]),
          },
        );
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(
            response.status >= 500
              ? "We couldn't check your payment. Please try again shortly."
              : "We couldn't confirm this checkout. Contact us if you paid.",
          );
          if (response.status < 500) {
            setAutoChecking(false);
            setLoading(false);
            return;
          }
        } else {
          setError("");
          setResult(data);
          if (["active", "not_active"].includes(data.status)) {
            setAutoChecking(false);
            setLoading(false);
            return;
          }
        }
      } catch {
        if (cancelled) return;
        setError("We couldn't check your payment. Please try again shortly.");
      }
      if (cancelled) return;
      setLoading(false);
      if (Date.now() < deadline) {
        checks++;
        timer = setTimeout(() => void check(), checks < 5 ? 2000 : 5000);
      } else setAutoChecking(false);
    }
    void check();
    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [retry]);

  const paid = result?.status === "active";
  const invite = communityInvite(
    process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL,
  );
  return (
    <section className={styles.content} aria-live="polite" aria-busy={loading}>
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
            : result?.status === "failed" && !autoChecking
              ? "Payment not completed"
              : result?.status === "not_active"
                ? "Your membership is not active"
                : "We're confirming your payment"}
      </h1>
      {paid ? (
        <>
          <p className={styles.greeting}>Welcome to Influencey English!</p>
          <p className={styles.description}>
            Watch the video, then join our WhatsApp community.
          </p>
          <figure className={styles.joiningVideo}>
            <VideoPlayer
              src={joiningTutorialVideo}
              label="Community joining video"
              fallback="The video is unavailable. You can still join below."
            />
          </figure>
          {invite ? (
            <a
              className={styles.cta}
              href={invite}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className={styles.whatsappIcon}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="#25D366"
                  d="M12 2a10 10 0 0 0-8.66 15L2 22l5.14-1.35A10 10 0 1 0 12 2Z"
                />
                <path
                  fill="#fff"
                  d="M8.1 6.8c-.2-.5-.4-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.4 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4l-1.8-.8c-.3-.1-.5-.2-.7.2l-.9 1c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.1-.3 0-.5.2-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-.9-2.1Z"
                />
              </svg>
              <span>Join WhatsApp Community</span>
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
              Please join using the WhatsApp number entered at checkout. An
              admin will approve your request shortly.
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
              Please wait while we confirm your payment.
            </p>
          )}
          {error && (
            <p className={styles.description} role="alert">
              {error}
            </p>
          )}
          {!loading &&
            !error &&
            [
              "awaiting_full_payment",
              "pending",
              ...(autoChecking ? ["failed"] : []),
            ].includes(result?.status || "") && (
              <p className={styles.description}>
                {autoChecking
                  ? "Thanks! We're confirming your payment. This page will update automatically."
                  : "We're still waiting for payment confirmation. You can close this page. We'll email you once confirmed. Please don't pay again."}
              </p>
            )}
          {!loading && result?.status === "not_active" && (
            <p className={styles.description}>
              Your membership is not active. Contact our team if you need help
              with this payment.
            </p>
          )}
          {!loading && !autoChecking && result?.status === "failed" && (
            <p className={styles.description}>
              Your payment was not completed. If money was debited, contact our
              team before trying again.
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              disabled={loading || autoChecking}
              onClick={() => setRetry((value) => value + 1)}
            >
              {autoChecking
                ? "Checking automatically..."
                : "Check payment status"}
            </button>
            <Link href="/contact">Contact support</Link>
          </div>
        </>
      )}
    </section>
  );
}

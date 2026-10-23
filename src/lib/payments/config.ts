import "server-only";
import { getBusinessDetails } from "@/content/business";
import { PaymentError, type CheckoutMode } from "./types";
export type PaymentConfig = {
  mode: CheckoutMode;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  previousWebhookSecret?: string;
  monthlyPlanId: string;
  yearlyPlanId: string;
  databaseUrl: string;
};
export function paymentConfig(): PaymentConfig {
  const business = getBusinessDetails();
  const mode = process.env.RAZORPAY_MODE || "test";
  const {
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID,
    DATABASE_URL,
  } = process.env;
  const keyId = RAZORPAY_KEY_ID?.trim();
  const keySecret = RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = RAZORPAY_WEBHOOK_SECRET?.trim();
  const publicKeyId = NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const databaseUrl = DATABASE_URL?.trim();
  const monthlyPlanId = (
    process.env.RAZORPAY_PLAN_MONTHLY || process.env.RAZORPAY_MONTHLY_PLAN_ID
  )?.trim();
  const yearlyPlanId = (
    process.env.RAZORPAY_PLAN_YEARLY || process.env.RAZORPAY_YEARLY_PLAN_ID
  )?.trim();
  if (
    (mode !== "test" && mode !== "live") ||
    !keyId ||
    !keySecret ||
    !webhookSecret ||
    !monthlyPlanId ||
    !yearlyPlanId ||
    !databaseUrl
  )
    throw new PaymentError(
      503,
      "Online checkout is being configured. Please contact support.",
    );
  if (
    !keyId.startsWith(`rzp_${mode}_`) ||
    (publicKeyId !== undefined && publicKeyId !== keyId) ||
    !/^plan_[A-Za-z0-9]+$/.test(monthlyPlanId) ||
    !/^plan_[A-Za-z0-9]+$/.test(yearlyPlanId) ||
    monthlyPlanId === yearlyPlanId ||
    keySecret === keyId ||
    webhookSecret === keySecret
  )
    throw new PaymentError(
      503,
      "Payment configuration needs review. Please contact support.",
    );
  if (
    mode === "live" &&
    process.env.VERCEL_ENV &&
    process.env.VERCEL_ENV !== "production"
  )
    throw new PaymentError(
      503,
      "Live payments are only enabled on the production website.",
    );
  if (
    mode === "live" &&
    (process.env.RAZORPAY_ENABLE_LIVE !== "true" ||
      !business.detailsConfirmed ||
      business.legalName.includes("[") ||
      business.deliveryPlatform.includes("["))
  )
    throw new PaymentError(
      503,
      "Live enrolment is not enabled. Please contact support.",
    );
  return {
    mode,
    keyId,
    keySecret,
    webhookSecret,
    previousWebhookSecret: process.env.RAZORPAY_PREVIOUS_WEBHOOK_SECRET,
    monthlyPlanId,
    yearlyPlanId,
    databaseUrl,
  };
}

import "server-only";
import { business } from "@/content/business";
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
  const mode = process.env.RAZORPAY_MODE || "test";
  const {
    RAZORPAY_KEY_ID: keyId,
    RAZORPAY_KEY_SECRET: keySecret,
    RAZORPAY_WEBHOOK_SECRET: webhookSecret,
    RAZORPAY_MONTHLY_PLAN_ID: monthlyPlanId,
    RAZORPAY_YEARLY_PLAN_ID: yearlyPlanId,
    DATABASE_URL: databaseUrl,
  } = process.env;
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
    !/^plan_[A-Za-z0-9]+$/.test(monthlyPlanId) ||
    !/^plan_[A-Za-z0-9]+$/.test(yearlyPlanId) ||
    monthlyPlanId === yearlyPlanId
  )
    throw new PaymentError(
      503,
      "Payment configuration needs review. Please contact support.",
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

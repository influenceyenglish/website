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
export class PaymentConfigurationError extends PaymentError {
  constructor(
    public code: string,
    public operatorMessage: string,
    customerMessage: string,
  ) {
    super(
      503,
      `${customerMessage} Please contact support. Reference: ${code}.`,
    );
  }
}

function configurationError(
  code: string,
  action: string,
  message: string,
): never {
  throw new PaymentConfigurationError(code, action, message);
}
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
  if (!keyId.startsWith(`rzp_${mode}_`))
    configurationError(
      "PAYMENT_KEY_MODE_MISMATCH",
      "RAZORPAY_KEY_ID must use the rzp_test_ or rzp_live_ prefix matching RAZORPAY_MODE.",
      "Checkout is configured with keys for a different payment mode.",
    );
  if (publicKeyId !== undefined && publicKeyId !== keyId)
    configurationError(
      "PAYMENT_PUBLIC_KEY_MISMATCH",
      "NEXT_PUBLIC_RAZORPAY_KEY_ID must exactly match RAZORPAY_KEY_ID in this deployment. Update both in the same Vercel environment and redeploy.",
      "The website and server checkout keys do not match.",
    );
  for (const [name, id] of [
    ["RAZORPAY_PLAN_MONTHLY", monthlyPlanId],
    ["RAZORPAY_PLAN_YEARLY", yearlyPlanId],
  ]) {
    if (!/^plan_[A-Za-z0-9]+$/.test(id))
      configurationError(
        name === "RAZORPAY_PLAN_MONTHLY"
          ? "PAYMENT_MONTHLY_PLAN_INVALID"
          : "PAYMENT_YEARLY_PLAN_INVALID",
        `${name} must contain a Razorpay plan_ ID, not a price, subscription ID, quoted value or placeholder.`,
        "A membership plan has an invalid checkout configuration.",
      );
  }
  if (monthlyPlanId === yearlyPlanId)
    configurationError(
      "PAYMENT_PLAN_IDS_DUPLICATED",
      "RAZORPAY_PLAN_MONTHLY and RAZORPAY_PLAN_YEARLY must point to different Razorpay plans.",
      "Monthly and yearly checkout plans have been configured as the same plan.",
    );
  if (keySecret === keyId)
    configurationError(
      "PAYMENT_API_SECRET_INVALID",
      "RAZORPAY_KEY_SECRET contains the key ID. Use the matching API key secret from Razorpay instead.",
      "The payment API credentials need correction.",
    );
  if (webhookSecret === keySecret)
    configurationError(
      "PAYMENT_WEBHOOK_SECRET_REUSED",
      "RAZORPAY_WEBHOOK_SECRET must match the webhook's dedicated signing secret and differ from RAZORPAY_KEY_SECRET. Update the webhook and Vercel together if necessary.",
      "The payment notification credentials need correction.",
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

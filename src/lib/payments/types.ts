import { z } from "zod";
export const createCheckoutSchema = z
  .object({
    requestId: z.uuid(),
    plan: z.enum(["monthly", "yearly"]),
    name: z.string().trim().min(2).max(80),
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/)
      .optional(),
    consent: z.literal(true),
  })
  .strict();
export const verifyCheckoutSchema = z
  .object({
    requestId: z.uuid(),
    razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
    razorpay_subscription_id: z.string().regex(/^sub_[A-Za-z0-9]+$/),
    razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();
export const webhookSchema = z
  .object({
    event: z.string().min(1).max(100),
    created_at: z.number().int().nonnegative(),
    payload: z
      .object({
        subscription: z
          .object({
            entity: z
              .object({
                id: z.string().regex(/^sub_[A-Za-z0-9]+$/),
                current_end: z.number().int().nullable().optional(),
                notes: z.record(z.string(), z.unknown()).optional(),
              })
              .passthrough(),
          })
          .optional(),
        payment: z
          .object({
            entity: z
              .object({ id: z.string().regex(/^pay_[A-Za-z0-9]+$/) })
              .passthrough(),
          })
          .optional(),
        refund: z
          .object({
            entity: z
              .object({
                payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
                status: z.string(),
              })
              .passthrough(),
          })
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CheckoutMode = "test" | "live";
export type Attempt = {
  id: string;
  mode: CheckoutMode;
  session_hash: string;
  plan: "monthly" | "yearly";
  provider_plan_id: string;
  expected_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  state: "creating" | "ready" | "uncertain";
  subscription_id: string | null;
  verified_payment_id: string | null;
  created_at: Date;
};
export type PaymentGrant = {
  paymentId: string;
  subscriptionId: string;
  amount: number;
  paidUntil: number;
};
export type ProviderSubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_end: number | null;
  notes?: Record<string, string>;
};
export type ProviderPayment = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  amount_refunded: number;
  invoice_id: string | null;
};
export type ProviderInvoice = {
  id: string;
  subscription_id?: string;
  payment_id: string | null;
  status: string;
  amount_paid: number;
  currency: string;
  billing_end: number | null;
};
export type ProviderPlan = {
  id: string;
  period: string;
  interval: number;
  item: { amount: number; currency: string };
};
export interface PaymentGateway {
  getPlan(id: string): Promise<ProviderPlan>;
  createSubscription(input: {
    plan_id: string;
    total_count: number;
    quantity: number;
    customer_notify: boolean;
    notes: Record<string, string>;
  }): Promise<ProviderSubscription>;
  getSubscription(id: string): Promise<ProviderSubscription>;
  getPayment(id: string): Promise<ProviderPayment>;
  getInvoice(id: string): Promise<ProviderInvoice>;
}
export class PaymentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

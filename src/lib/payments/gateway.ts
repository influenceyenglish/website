import "server-only";
import { z } from "zod";
import {
  PaymentError,
  type PaymentGateway,
  type ProviderPlan,
  type ProviderSubscription,
  type ProviderPayment,
  type ProviderInvoice,
} from "./types";
import type { PaymentConfig } from "./config";
const subscription = z.object({
  id: z.string(),
  plan_id: z.string(),
  status: z.string(),
  current_end: z.number().nullable(),
  notes: z.record(z.string(), z.string()).optional().catch({}),
});
const payment = z.object({
  id: z.string(),
  status: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  amount_refunded: z.number().int(),
  invoice_id: z.string().nullable(),
});
const invoice = z.object({
  id: z.string(),
  subscription_id: z.string().optional(),
  payment_id: z.string().nullable(),
  status: z.string(),
  amount_paid: z.number().int(),
  currency: z.string(),
  billing_end: z.number().nullable(),
});
const plan = z.object({
  id: z.string(),
  period: z.string(),
  interval: z.number().int(),
  item: z.object({ amount: z.number().int(), currency: z.string() }),
});
export class RazorpayGateway implements PaymentGateway {
  constructor(private config: Pick<PaymentConfig, "keyId" | "keySecret">) {}
  private async request<T>(
    path: string,
    schema: z.ZodType<T>,
    body?: unknown,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`https://api.razorpay.com/v1${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new PaymentError(
        503,
        "The payment provider did not respond. Please check your payment status before retrying.",
      );
    }
    if (!response.ok)
      throw new PaymentError(
        502,
        "The payment provider could not complete this request. Please contact support.",
      );
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success)
      throw new PaymentError(
        502,
        "The payment response could not be confirmed. Please contact support.",
      );
    return parsed.data;
  }
  getPlan(id: string): Promise<ProviderPlan> {
    return this.request(`/plans/${encodeURIComponent(id)}`, plan);
  }
  createSubscription(
    input: Parameters<PaymentGateway["createSubscription"]>[0],
  ): Promise<ProviderSubscription> {
    return this.request("/subscriptions", subscription, input);
  }
  getSubscription(id: string): Promise<ProviderSubscription> {
    return this.request(
      `/subscriptions/${encodeURIComponent(id)}`,
      subscription,
    );
  }
  getPayment(id: string): Promise<ProviderPayment> {
    return this.request(`/payments/${encodeURIComponent(id)}`, payment);
  }
  getInvoice(id: string): Promise<ProviderInvoice> {
    return this.request(`/invoices/${encodeURIComponent(id)}`, invoice);
  }
}

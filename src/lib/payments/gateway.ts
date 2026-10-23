import "server-only";
import { z } from "zod";
import Razorpay from "razorpay";
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
  private client: Razorpay;
  constructor(config: Pick<PaymentConfig, "keyId" | "keySecret">) {
    this.client = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }
  private async request<T>(
    operation: () => Promise<unknown>,
    schema: z.ZodType<T>,
  ): Promise<T> {
    let response: unknown;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // Never retry an uncertain create; the service persists the attempt so
      // webhooks can reconcile a subscription created after this timeout.
      response = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("Provider timeout")),
            8000,
          );
        }),
      ]);
    } catch {
      throw new PaymentError(
        503,
        "The payment provider did not respond. Please check your payment status before retrying.",
      );
    } finally {
      clearTimeout(timeout);
    }
    const parsed = schema.safeParse(response);
    if (!parsed.success)
      throw new PaymentError(
        502,
        "The payment response could not be confirmed. Please contact support.",
      );
    return parsed.data;
  }
  getPlan(id: string): Promise<ProviderPlan> {
    return this.request(() => this.client.plans.fetch(id), plan);
  }
  createSubscription(
    input: Parameters<PaymentGateway["createSubscription"]>[0],
  ): Promise<ProviderSubscription> {
    return this.request(
      () => this.client.subscriptions.create(input),
      subscription,
    );
  }
  getSubscription(id: string): Promise<ProviderSubscription> {
    return this.request(
      () => this.client.subscriptions.fetch(id),
      subscription,
    );
  }
  getPayment(id: string): Promise<ProviderPayment> {
    return this.request(() => this.client.payments.fetch(id), payment);
  }
  getInvoice(id: string): Promise<ProviderInvoice> {
    return this.request(() => this.client.invoices.fetch(id), invoice);
  }
}

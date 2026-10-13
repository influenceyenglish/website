import { business } from "@/content/business";
import { plans, type PlanKey } from "@/content/site";
import {
  PaymentError,
  webhookSchema,
  type PaymentGateway,
  type Attempt,
  type CreateCheckoutInput,
  type PaymentGrant,
  type ProviderSubscription,
  type ProviderPayment,
  type CheckoutMode,
} from "./types";
import { verifyCheckoutSignature, validSignature, hash } from "./signatures";
import { PaymentStore, type WebhookWork } from "./store";
export type ServiceConfig = {
  mode: CheckoutMode;
  keySecret: string;
  webhookSecret: string;
  previousWebhookSecret?: string;
  monthlyPlanId: string;
  yearlyPlanId: string;
};

export class PaymentService {
  constructor(
    private config: ServiceConfig,
    private store: PaymentStore,
    private gateway: PaymentGateway,
  ) {}
  private planId(plan: PlanKey) {
    return plan === "monthly"
      ? this.config.monthlyPlanId
      : this.config.yearlyPlanId;
  }
  async create(input: CreateCheckoutInput, sessionHash: string) {
    const claim = await this.store.claim(
      input,
      sessionHash,
      business.policyVersion,
      this.planId(input.plan),
      plans[input.plan].amount,
    );
    if (!claim.created) {
      if (new Date(claim.attempt.created_at).getTime() + 86400_000 < Date.now())
        throw new PaymentError(
          410,
          "This checkout attempt has expired. Contact support before starting again.",
        );
      if (claim.attempt.expected_amount !== plans[input.plan].amount)
        throw new PaymentError(
          409,
          "Pricing has changed since this checkout started. Contact support before retrying.",
        );
      if (claim.attempt.subscription_id) return claim.attempt;
      if (claim.attempt.state === "uncertain")
        throw new PaymentError(
          409,
          "Payment preparation needs review. Please contact support before starting another checkout.",
        );
      throw new PaymentError(
        409,
        "This checkout is still being prepared. Wait a moment and retry.",
      );
    }
    try {
      const expected = plans[input.plan],
        remotePlan = await this.gateway.getPlan(this.planId(input.plan));
      if (
        remotePlan.id !== this.planId(input.plan) ||
        remotePlan.period !== expected.period ||
        remotePlan.interval !== 1 ||
        remotePlan.item.amount !== expected.amount ||
        remotePlan.item.currency !== "INR"
      )
        throw new PaymentError(
          503,
          "The configured payment plan does not match the advertised INR price. Please contact support.",
        );
      const subscription = await this.gateway.createSubscription({
        plan_id: remotePlan.id,
        total_count: expected.totalCount,
        quantity: 1,
        customer_notify: true,
        notes: {
          checkout_attempt_id: input.requestId,
          plan: input.plan,
          policy_version: business.policyVersion,
        },
      });
      if (
        !/^sub_[A-Za-z0-9]+$/.test(subscription.id) ||
        subscription.plan_id !== remotePlan.id
      )
        throw new PaymentError(
          502,
          "Subscription details could not be confirmed.",
        );
      await this.store.attach(input.requestId, subscription.id);
      const result = await this.store.findAttempt(input.requestId);
      if (!result)
        throw new PaymentError(503, "Checkout could not be prepared.");
      return result;
    } catch (error) {
      await this.store.uncertain(input.requestId);
      throw error;
    }
  }
  async boundAttempt(id: string, sessionHash: string) {
    const attempt = await this.store.findAttempt(id);
    if (!attempt || attempt.session_hash !== sessionHash)
      throw new PaymentError(
        404,
        "No checkout was found for this browser. Please contact support if you paid.",
      );
    return attempt;
  }
  private async inspectPayment(
    attempt: Attempt,
    paymentId: string,
    snapshotEnd?: number | null,
    observedPayment?: ProviderPayment,
  ): Promise<PaymentGrant | null> {
    const payment =
      observedPayment || (await this.gateway.getPayment(paymentId));
    if (payment.id !== paymentId)
      throw new PaymentError(400, "Payment details do not match.");
    const expectedAmount = attempt.expected_amount;
    // Authorisation-only charges never create membership access.
    if (
      payment.status !== "captured" ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      payment.amount_refunded > 0 ||
      !payment.invoice_id
    )
      return null;
    const invoice = await this.gateway.getInvoice(payment.invoice_id);
    if (
      invoice.id !== payment.invoice_id ||
      invoice.subscription_id !== attempt.subscription_id ||
      invoice.payment_id !== payment.id ||
      invoice.status !== "paid" ||
      invoice.currency !== "INR" ||
      invoice.amount_paid !== expectedAmount
    )
      return null;
    const end = invoice.billing_end || snapshotEnd;
    // Do not use today's subscription.current_end for a delayed older payment.
    if (
      !end ||
      !Number.isSafeInteger(end) ||
      end <= 0 ||
      end > Date.now() / 1000 + 370 * 86400
    )
      return null;
    return {
      paymentId: payment.id,
      subscriptionId: attempt.subscription_id!,
      amount: payment.amount,
      paidUntil: end,
    };
  }
  async verify(
    input: {
      requestId: string;
      razorpay_payment_id: string;
      razorpay_subscription_id: string;
      razorpay_signature: string;
    },
    sessionHash: string,
  ) {
    const attempt = await this.boundAttempt(input.requestId, sessionHash);
    if (
      !attempt.subscription_id ||
      input.razorpay_subscription_id !== attempt.subscription_id ||
      !verifyCheckoutSignature(
        input.razorpay_payment_id,
        attempt.subscription_id,
        input.razorpay_signature,
        this.config.keySecret,
      )
    )
      throw new PaymentError(
        400,
        "Payment signature verification failed. Please contact support if money was debited.",
      );
    const remote = await this.gateway.getSubscription(attempt.subscription_id);
    if (
      remote.id !== attempt.subscription_id ||
      remote.plan_id !== attempt.provider_plan_id
    )
      throw new PaymentError(
        400,
        "Subscription details do not match your chosen plan.",
      );
    const observedPayment = await this.gateway.getPayment(
      input.razorpay_payment_id,
    );
    if (observedPayment.id !== input.razorpay_payment_id)
      throw new PaymentError(400, "Payment details do not match.");
    if (observedPayment.amount_refunded > 0)
      await this.store.recordReversal(
        observedPayment.id,
        "refund_detected_during_verification",
      );
    const grant = await this.inspectPayment(
      attempt,
      input.razorpay_payment_id,
      undefined,
      observedPayment,
    );
    if (grant) await this.store.recordGrant(grant);
    await this.store.verifyAttempt(attempt.id, input.razorpay_payment_id);
    const refreshed = await this.store.findAttempt(attempt.id);
    return this.store.status(refreshed!);
  }
  private async ownedSubscription(remote: ProviderSubscription) {
    let attempt = await this.store.findSubscription(remote.id);
    if (!attempt && remote.notes?.checkout_attempt_id) {
      const candidate = await this.store.findAttempt(
        remote.notes.checkout_attempt_id,
      );
      if (
        candidate &&
        candidate.mode === this.config.mode &&
        remote.plan_id === candidate.provider_plan_id
      ) {
        await this.store.attach(candidate.id, remote.id);
        attempt = await this.store.findAttempt(candidate.id);
      }
    }
    if (attempt && remote.plan_id !== attempt.provider_plan_id)
      throw new PaymentError(400, "Webhook subscription plan mismatch.");
    return attempt;
  }
  async webhook(raw: Buffer, signature: string | null, eventId: string | null) {
    const valid =
      validSignature(raw, signature, this.config.webhookSecret) ||
      (this.config.previousWebhookSecret
        ? validSignature(raw, signature, this.config.previousWebhookSecret)
        : false);
    if (!valid) throw new PaymentError(400, "Invalid webhook signature.");
    if (!eventId || !/^[-A-Za-z0-9_:.]{1,200}$/.test(eventId))
      throw new PaymentError(400, "Missing or invalid webhook event ID.");
    const bodyHash = hash(raw);
    if (await this.store.eventSeen(eventId, bodyHash))
      return { received: true, duplicate: true };
    let value: unknown;
    try {
      value = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new PaymentError(400, "Invalid webhook JSON.");
    }
    const parsed = webhookSchema.safeParse(value);
    if (!parsed.success)
      throw new PaymentError(400, "Invalid webhook payload.");
    const event = parsed.data;
    const work: WebhookWork = {
      id: eventId,
      hash: bodyHash,
      event: event.event,
    };
    const entity = event.payload.subscription?.entity;
    if (entity && event.event.startsWith("subscription.")) {
      const remote = await this.gateway.getSubscription(entity.id);
      if (remote.id !== entity.id)
        throw new PaymentError(400, "Webhook subscription mismatch.");
      const attempt = await this.ownedSubscription(remote);
      if (attempt) {
        work.subscription = {
          id: entity.id,
          status: remote.status,
          eventAt: event.created_at,
        };
        if (event.event === "subscription.charged" && event.payload.payment) {
          const grant = await this.inspectPayment(
            attempt,
            event.payload.payment.entity.id,
            entity.current_end,
          );
          if (grant) work.grant = grant;
        }
      }
    }
    if (event.event === "payment.captured" && event.payload.payment) {
      const payment = await this.gateway.getPayment(
        event.payload.payment.entity.id,
      );
      if (payment.invoice_id) {
        const invoice = await this.gateway.getInvoice(payment.invoice_id);
        if (invoice.subscription_id) {
          const remote = await this.gateway.getSubscription(
            invoice.subscription_id,
          );
          const attempt = await this.ownedSubscription(remote);
          if (attempt) {
            const grant = await this.inspectPayment(attempt, payment.id);
            if (grant) work.grant = grant;
          }
        }
      }
    }
    if (event.event === "payment.refunded" && event.payload.payment) {
      const payment = await this.gateway.getPayment(
        event.payload.payment.entity.id,
      );
      if (payment.amount_refunded > 0) {
        work.reversePaymentId = payment.id;
        work.reversalReason = "refund";
      }
    }
    if (
      event.event === "refund.processed" &&
      event.payload.refund?.entity.status === "processed"
    ) {
      const payment = await this.gateway.getPayment(
        event.payload.refund.entity.payment_id,
      );
      if (payment.amount_refunded > 0) {
        work.reversePaymentId = payment.id;
        work.reversalReason = "refund";
      }
    }
    const processed = await this.store.applyWebhook(work);
    return { received: true, duplicate: !processed };
  }
}

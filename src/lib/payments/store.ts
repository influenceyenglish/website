import {
  PaymentError,
  type Attempt,
  type CheckoutMode,
  type CreateCheckoutInput,
  type PaymentGrant,
} from "./types";
export type SqlResult = { rows: Record<string, unknown>[] };
export interface SQL {
  query(text: string, values?: unknown[]): Promise<SqlResult>;
}
export interface Database extends SQL {
  transaction<T>(work: (sql: SQL) => Promise<T>): Promise<T>;
}
export type WebhookWork = {
  id: string;
  hash: string;
  event: string;
  eventAt: number;
  grant?: PaymentGrant;
  reversePaymentId?: string;
  reversalReason?: string;
  refund?: { amount: number; amountRefunded: number; invoiceId: string | null };
  failedPayment?: { id?: string; subscriptionId: string };
  subscription?: { id: string; status: string; eventAt: number };
};
const attemptSelect = `SELECT s.id,s.mode,s.session_hash,s.plan,s.razorpay_plan_id AS provider_plan_id,
 s.expected_amount,m.full_name AS customer_name,m.email AS customer_email,m.phone AS customer_phone,
 s.checkout_state AS state,s.razorpay_subscription_id AS subscription_id,s.last_payment_id AS verified_payment_id,s.created_at
 FROM public.subscriptions s JOIN public.members m ON m.mode=s.mode AND m.id=s.member_id`;
// Demo-only throttle: entitlement, checkout idempotency and event state always live in Postgres.
const buckets = new Map<string, { count: number; expires: number }>();
export class PaymentStore {
  constructor(
    private db: Database,
    readonly mode: CheckoutMode,
  ) {}
  async claim(
    input: CreateCheckoutInput,
    sessionHash: string,
    policyVersion: string,
    providerPlanId: string,
    expectedAmount: number,
  ) {
    return this.db.transaction(async (sql) => {
      // Serialize retries before creating a member, including conflicting cross-mode IDs.
      await sql.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        input.requestId,
      ]);
      const prior = await sql.query(attemptSelect + " WHERE s.id=$1", [
        input.requestId,
      ]);
      if (prior.rows.length) {
        const existing = prior.rows[0] as unknown as Attempt;
        if (
          existing.mode !== this.mode ||
          existing.session_hash !== sessionHash ||
          existing.plan !== input.plan ||
          existing.customer_email !== input.email
        )
          throw new PaymentError(
            409,
            "This checkout request cannot be reused. Refresh and start a new checkout.",
          );
        return { attempt: existing, created: false };
      }
      const member = await sql.query(
        `INSERT INTO public.members(mode,full_name,email,phone) VALUES($1,$2,$3,$4)
        ON CONFLICT(mode,email) DO UPDATE SET email=EXCLUDED.email RETURNING id`,
        [this.mode, input.name, input.email, input.phone],
      );
      await sql.query(
        `INSERT INTO public.subscriptions(id,mode,member_id,session_hash,plan,policy_version,razorpay_plan_id,expected_amount)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          input.requestId,
          this.mode,
          member.rows[0].id,
          sessionHash,
          input.plan,
          policyVersion,
          providerPlanId,
          expectedAmount,
        ],
      );
      const result = await sql.query(
        attemptSelect + " WHERE s.id=$1 AND s.mode=$2",
        [input.requestId, this.mode],
      );
      return { attempt: result.rows[0] as unknown as Attempt, created: true };
    });
  }
  async findAttempt(id: string): Promise<Attempt | null> {
    const { rows } = await this.db.query(
      attemptSelect + " WHERE s.id=$1 AND s.mode=$2",
      [id, this.mode],
    );
    return (rows[0] as unknown as Attempt) || null;
  }
  async findSubscription(id: string): Promise<Attempt | null> {
    const { rows } = await this.db.query(
      attemptSelect + " WHERE s.razorpay_subscription_id=$1 AND s.mode=$2",
      [id, this.mode],
    );
    return (rows[0] as unknown as Attempt) || null;
  }
  async attach(id: string, subscriptionId: string) {
    const { rows } = await this.db.query(
      `UPDATE public.subscriptions SET razorpay_subscription_id=$1,checkout_state='ready',updated_at=now()
      WHERE id=$2 AND mode=$3 AND (razorpay_subscription_id IS NULL OR razorpay_subscription_id=$1) RETURNING id`,
      [subscriptionId, id, this.mode],
    );
    if (!rows.length)
      throw new PaymentError(
        409,
        "Subscription association could not be confirmed.",
      );
  }
  async uncertain(id: string) {
    await this.db.query(
      `UPDATE public.subscriptions SET checkout_state='uncertain',updated_at=now() WHERE id=$1 AND mode=$2 AND razorpay_subscription_id IS NULL`,
      [id, this.mode],
    );
  }
  async rateLimit(key: string, limit = 8, windowSeconds = 600) {
    if (this.mode !== "test")
      throw new PaymentError(
        503,
        "Live checkout requires shared rate limiting before it can be enabled.",
      );
    const now = Date.now();
    for (const [k, v] of buckets) if (v.expires <= now) buckets.delete(k);
    const id = `${this.mode}:${key}`;
    let bucket = buckets.get(id);
    if (!bucket) {
      if (buckets.size >= 10000)
        throw new PaymentError(
          429,
          "Too many payment attempts. Please try later.",
        );
      bucket = { count: 0, expires: now + windowSeconds * 1000 };
      buckets.set(id, bucket);
    }
    if (++bucket.count > limit)
      throw new PaymentError(
        429,
        "Too many payment attempts. Please wait 10 minutes or contact support.",
      );
  }
  async verifyAttempt(id: string, paymentId: string) {
    await this.db.query(
      `UPDATE public.subscriptions SET last_payment_id=coalesce(last_payment_id,$1),updated_at=now() WHERE id=$2 AND mode=$3`,
      [paymentId, id, this.mode],
    );
  }
  async eventSeen(id: string, bodyHash: string) {
    const { rows } = await this.db.query(
      "SELECT body_hash,processing_status FROM public.webhook_events WHERE mode=$1 AND event_id=$2",
      [this.mode, id],
    );
    if (!rows.length) return false;
    if (rows[0].body_hash !== bodyHash)
      throw new PaymentError(
        409,
        "Webhook event ID conflicts with an earlier payload.",
      );
    return ["processed", "ignored"].includes(String(rows[0].processing_status));
  }
  async applyWebhook(work: WebhookWork) {
    return this.db.transaction(async (sql) => {
      // Serialize effects per mode, including refund tombstones with no known subscription yet.
      await sql.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `payment-events:${this.mode}`,
      ]);
      const prior = await sql.query(
        "SELECT body_hash,processing_status FROM public.webhook_events WHERE mode=$1 AND event_id=$2 FOR UPDATE",
        [this.mode, work.id],
      );
      if (prior.rows.length) {
        if (prior.rows[0].body_hash !== work.hash)
          throw new PaymentError(
            409,
            "Webhook event ID conflicts with an earlier payload.",
          );
        if (
          ["processed", "ignored"].includes(
            String(prior.rows[0].processing_status),
          )
        )
          return false;
        await sql.query(
          "DELETE FROM public.webhook_events WHERE mode=$1 AND event_id=$2",
          [this.mode, work.id],
        );
      }
      const providerId =
        work.grant?.subscriptionId ||
        work.subscription?.id ||
        work.failedPayment?.subscriptionId;
      let localId: unknown = null;
      if (providerId) {
        const sub = await sql.query(
          "SELECT id FROM public.subscriptions WHERE mode=$1 AND razorpay_subscription_id=$2",
          [this.mode, providerId],
        );
        localId = sub.rows[0]?.id || null;
      }
      const paymentId =
        work.grant?.paymentId ||
        work.reversePaymentId ||
        work.failedPayment?.id ||
        null;
      const outcome = work.reversePaymentId
        ? work.refund && work.refund.amountRefunded < work.refund.amount
          ? "partially_refunded"
          : "refunded"
        : work.grant
          ? "captured"
          : work.failedPayment
            ? "failed"
            : null;
      await sql.query(
        `INSERT INTO public.webhook_events(mode,event_id,body_hash,event_type,event_at,subscription_id,razorpay_subscription_id,payment_id,payment_status,amount,currency,paid_until,provider_status,processing_status,processing_attempts,processed_at,invoice_id,amount_refunded)
        VALUES($1,$2,$3,$4,to_timestamp($5),$6,$7,$8,$9,$10,$11,to_timestamp($12),$13,'processed',1,now(),$14,$15)`,
        [
          this.mode,
          work.id,
          work.hash,
          work.event,
          work.eventAt,
          localId,
          providerId || null,
          paymentId,
          outcome,
          work.grant?.amount ?? work.refund?.amount ?? null,
          work.grant || work.refund ? "INR" : null,
          work.grant?.paidUntil ?? null,
          work.subscription?.status || null,
          work.grant?.invoiceId || work.refund?.invoiceId || null,
          work.refund?.amountRefunded ?? null,
        ],
      );
      if (work.subscription && localId)
        await sql.query(
          `UPDATE public.subscriptions SET provider_status=$1,last_provider_event_at=to_timestamp($2),updated_at=now()
        WHERE mode=$3 AND id=$4 AND (last_provider_event_at IS NULL OR last_provider_event_at<=to_timestamp($2))
        AND (provider_status IS NULL OR provider_status NOT IN ('cancelled','completed','expired') OR $1 IN ('cancelled','completed','expired'))`,
          [
            work.subscription.status,
            work.subscription.eventAt,
            this.mode,
            localId,
          ],
        );
      if (work.failedPayment && localId)
        await sql.query(
          `UPDATE public.subscriptions SET payment_status=CASE WHEN paid_until>now() THEN payment_status ELSE 'failed' END,
        failure_email_state=CASE WHEN failure_email_state='not_required' THEN 'pending' ELSE failure_email_state END,updated_at=now() WHERE mode=$1 AND id=$2`,
          [this.mode, localId],
        );
      // Recompute from all captured facts, excluding any payment with a refund fact.
      // This preserves older valid periods when a newer payment is refunded.
      const affected = await sql.query(
        `UPDATE public.subscriptions s SET paid_until=(SELECT max(e.paid_until) FROM public.webhook_events e
        WHERE e.mode=s.mode AND e.razorpay_subscription_id=s.razorpay_subscription_id AND e.payment_status='captured'
        AND NOT EXISTS(SELECT 1 FROM public.webhook_events r WHERE r.mode=e.mode AND r.payment_id=e.payment_id AND r.payment_status IN ('refunded','partially_refunded'))),updated_at=now()
        WHERE s.mode=$1 AND (s.id=$2 OR EXISTS(SELECT 1 FROM public.webhook_events p WHERE p.mode=s.mode AND p.razorpay_subscription_id=s.razorpay_subscription_id AND p.payment_id=$3)) RETURNING s.id,s.member_id`,
        [this.mode, localId, paymentId],
      );
      if (work.grant && localId)
        await sql.query(
          `UPDATE public.subscriptions SET last_payment_id=$1 WHERE mode=$2 AND id=$3`,
          [work.grant.paymentId, this.mode, localId],
        );
      await sql.query(
        `UPDATE public.subscriptions s SET payment_status=CASE WHEN s.paid_until IS NOT NULL THEN 'paid'
        WHEN EXISTS(SELECT 1 FROM public.webhook_events e WHERE e.mode=s.mode AND e.razorpay_subscription_id=s.razorpay_subscription_id AND e.payment_status='captured') THEN 'refunded'
        ELSE s.payment_status END WHERE s.mode=$1 AND s.id=ANY($2::uuid[])`,
        [this.mode, affected.rows.map((row) => row.id)],
      );
      await sql.query(
        `UPDATE public.members m SET status=CASE
        WHEN EXISTS(SELECT 1 FROM public.subscriptions s WHERE s.mode=m.mode AND s.member_id=m.id AND s.paid_until>now()) THEN 'active'
        WHEN EXISTS(SELECT 1 FROM public.subscriptions s WHERE s.mode=m.mode AND s.member_id=m.id AND (s.paid_until IS NOT NULL OR s.payment_status IN ('paid','refunded','partially_refunded'))) THEN 'inactive'
        ELSE 'pending' END,updated_at=now() WHERE m.mode=$1 AND m.id=ANY($2::uuid[])`,
        [this.mode, affected.rows.map((row) => row.member_id)],
      );
      return true;
    });
  }
  async status(attempt: Attempt) {
    const { rows } = await this.db.query(
      "SELECT paid_until,payment_status,last_payment_id FROM public.subscriptions WHERE id=$1 AND mode=$2",
      [attempt.id, this.mode],
    );
    const row = rows[0];
    const until = row?.paid_until ? new Date(String(row.paid_until)) : null;
    return {
      status:
        until && until.getTime() > Date.now()
          ? "active"
          : until ||
              ["paid", "refunded", "partially_refunded"].includes(
                String(row?.payment_status),
              )
            ? "not_active"
            : row?.last_payment_id
              ? "awaiting_full_payment"
              : "pending",
      paidUntil: until?.toISOString() || null,
      mode: this.mode,
    } as const;
  }
}

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
  grant?: PaymentGrant;
  reversePaymentId?: string;
  reversalReason?: string;
  subscription?: { id: string; status: string; eventAt: number };
};

/** All fulfilment and event-marker writes share one database transaction. */
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
    const result = await this.db.query(
      `INSERT INTO checkout_attempts(id,mode,session_hash,plan,customer_name,customer_email,customer_phone,policy_version,provider_plan_id,expected_amount) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO NOTHING RETURNING *`,
      [
        input.requestId,
        this.mode,
        sessionHash,
        input.plan,
        input.name,
        input.email,
        input.phone || null,
        policyVersion,
        providerPlanId,
        expectedAmount,
      ],
    );
    const attempt = result.rows[0] as unknown as Attempt | undefined;
    if (attempt) return { attempt, created: true };
    const existing = await this.findAttempt(input.requestId);
    if (
      !existing ||
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
  async findAttempt(id: string): Promise<Attempt | null> {
    const { rows } = await this.db.query(
      "SELECT * FROM checkout_attempts WHERE id=$1 AND mode=$2",
      [id, this.mode],
    );
    return (rows[0] as unknown as Attempt) || null;
  }
  async findSubscription(id: string): Promise<Attempt | null> {
    const { rows } = await this.db.query(
      "SELECT * FROM checkout_attempts WHERE subscription_id=$1 AND mode=$2",
      [id, this.mode],
    );
    return (rows[0] as unknown as Attempt) || null;
  }
  async attach(id: string, subscriptionId: string) {
    const { rows } = await this.db.query(
      `UPDATE checkout_attempts SET subscription_id=$1,state='ready' WHERE id=$2 AND mode=$3 AND (subscription_id IS NULL OR subscription_id=$1) RETURNING id`,
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
      `UPDATE checkout_attempts SET state='uncertain' WHERE id=$1 AND mode=$2 AND subscription_id IS NULL`,
      [id, this.mode],
    );
  }
  async rateLimit(key: string, limit = 8, windowSeconds = 600) {
    const window = Math.floor(Date.now() / (windowSeconds * 1000));
    const { rows } = await this.db.query(
      `INSERT INTO payment_rate_limits(bucket,count,expires_at) VALUES($1,1,to_timestamp($2)) ON CONFLICT(bucket) DO UPDATE SET count=payment_rate_limits.count+1 RETURNING count`,
      [`${this.mode}:${key}:${window}`, (window + 1) * windowSeconds],
    );
    if (Number(rows[0].count) > limit)
      throw new PaymentError(
        429,
        "Too many payment attempts. Please wait 10 minutes or contact support.",
      );
  }
  async verifyAttempt(id: string, paymentId: string) {
    await this.db.query(
      "UPDATE checkout_attempts SET verified_payment_id=$1 WHERE id=$2 AND mode=$3",
      [paymentId, id, this.mode],
    );
  }
  async eventSeen(id: string, bodyHash: string) {
    const { rows } = await this.db.query(
      "SELECT body_hash FROM webhook_events WHERE mode=$1 AND event_id=$2",
      [this.mode, id],
    );
    if (!rows.length) return false;
    if (rows[0].body_hash !== bodyHash)
      throw new PaymentError(
        409,
        "Webhook event ID conflicts with an earlier payload.",
      );
    return true;
  }
  private async outbox(
    sql: SQL,
    subscriptionId: string,
    key: string,
    kind: string,
  ) {
    await sql.query(
      `INSERT INTO membership_outbox(mode,subscription_id,event_key,kind) VALUES($1,$2,$3,$4) ON CONFLICT(mode,event_key) DO NOTHING`,
      [this.mode, subscriptionId, key, kind],
    );
  }
  private async grant(sql: SQL, grant: PaymentGrant) {
    const { rows } = await sql.query(
      `INSERT INTO payment_grants(mode,payment_id,subscription_id,amount,paid_until) VALUES($1,$2,$3,$4,to_timestamp($5)) ON CONFLICT(mode,payment_id) DO NOTHING RETURNING payment_id`,
      [
        this.mode,
        grant.paymentId,
        grant.subscriptionId,
        grant.amount,
        grant.paidUntil,
      ],
    );
    if (rows.length) {
      const reversed = await sql.query(
        "SELECT payment_id FROM payment_reversals WHERE mode=$1 AND payment_id=$2",
        [this.mode, grant.paymentId],
      );
      if (!reversed.rows.length)
        await this.outbox(
          sql,
          grant.subscriptionId,
          `paid:${grant.paymentId}`,
          "payment_verified",
        );
    }
  }
  async recordGrant(grant: PaymentGrant) {
    await this.db.transaction((sql) => this.grant(sql, grant));
  }
  private async reverse(sql: SQL, paymentId: string, reason: string) {
    await sql.query(
      `INSERT INTO payment_reversals(mode,payment_id,reason) VALUES($1,$2,$3) ON CONFLICT(mode,payment_id) DO NOTHING`,
      [this.mode, paymentId, reason],
    );
    const prior = await sql.query(
      "SELECT subscription_id FROM payment_grants WHERE mode=$1 AND payment_id=$2",
      [this.mode, paymentId],
    );
    if (prior.rows[0])
      await this.outbox(
        sql,
        String(prior.rows[0].subscription_id),
        `reverse:${paymentId}`,
        "payment_reversed",
      );
  }
  async recordReversal(paymentId: string, reason: string) {
    await this.db.transaction((sql) => this.reverse(sql, paymentId, reason));
  }
  async applyWebhook(work: WebhookWork) {
    return this.db.transaction(async (sql) => {
      const inserted = await sql.query(
        `INSERT INTO webhook_events(mode,event_id,body_hash,event_type) VALUES($1,$2,$3,$4) ON CONFLICT(mode,event_id) DO NOTHING RETURNING event_id`,
        [this.mode, work.id, work.hash, work.event],
      );
      if (!inserted.rows.length) {
        const prior = await sql.query(
          "SELECT body_hash FROM webhook_events WHERE mode=$1 AND event_id=$2",
          [this.mode, work.id],
        );
        if (prior.rows[0].body_hash !== work.hash)
          throw new PaymentError(
            409,
            "Webhook event ID conflicts with an earlier payload.",
          );
        return false;
      }
      if (work.grant) await this.grant(sql, work.grant);
      if (work.reversePaymentId)
        await this.reverse(
          sql,
          work.reversePaymentId,
          work.reversalReason || work.event,
        );
      if (work.subscription) {
        const sub = work.subscription;
        await sql.query(
          `INSERT INTO subscription_states(mode,subscription_id,provider_status,event_at) VALUES($1,$2,$3,$4) ON CONFLICT(mode,subscription_id) DO UPDATE SET provider_status=EXCLUDED.provider_status,event_at=EXCLUDED.event_at,updated_at=now() WHERE subscription_states.event_at<=EXCLUDED.event_at AND (subscription_states.provider_status NOT IN ('cancelled','completed','expired') OR EXCLUDED.provider_status IN ('cancelled','completed','expired'))`,
          [this.mode, sub.id, sub.status, sub.eventAt],
        );
        await this.outbox(
          sql,
          sub.id,
          `lifecycle:${work.id}`,
          "subscription_updated",
        );
      }
      return true;
    });
  }
  async status(attempt: Attempt) {
    const { rows } = await this.db.query(
      `SELECT MAX(g.paid_until) FILTER(WHERE r.payment_id IS NULL) AS paid_until,COUNT(g.payment_id) AS payments FROM payment_grants g LEFT JOIN payment_reversals r ON r.mode=g.mode AND r.payment_id=g.payment_id WHERE g.mode=$1 AND g.subscription_id=$2`,
      [this.mode, attempt.subscription_id],
    );
    const until = rows[0]?.paid_until
      ? new Date(String(rows[0].paid_until))
      : null;
    return {
      status:
        until && until.getTime() > Date.now()
          ? "active"
          : Number(rows[0]?.payments) > 0
            ? "not_active"
            : attempt.verified_payment_id
              ? "awaiting_full_payment"
              : "pending",
      paidUntil: until?.toISOString() || null,
      mode: this.mode,
    } as const;
  }
}

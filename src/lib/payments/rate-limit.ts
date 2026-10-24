import "server-only";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { PaymentError, type CheckoutMode } from "./types";

type Decision = { success: boolean; reason?: string };
type SharedLimiter = { limit(key: string): Promise<Decision> };
type Environment = Record<string, string | undefined>;
type LimiterFactory = (
  url: string,
  token: string,
  prefix: string,
  limit: number,
  windowSeconds: number,
) => SharedLimiter;

const unavailable = () =>
  new PaymentError(
    503,
    "Payment protection is unavailable. Please try again later.",
  );

const upstashLimiter: LimiterFactory = (url, token, prefix, limit, seconds) =>
  new Ratelimit({
    redis: new Redis({ url, token, retry: false }),
    limiter: Ratelimit.slidingWindow(limit, `${seconds} s`),
    prefix,
    analytics: false,
    ephemeralCache: false,
    timeout: 3000,
  });

/** Each instance has its own clients; counters are shared by Redis, not memory. */
export function createPaymentRateLimiter(
  env: Environment = process.env,
  factory: LimiterFactory = upstashLimiter,
) {
  const clients = new Map<string, SharedLimiter>();
  // Only local test mode may fall back to bounded process-local counters.
  const buckets = new Map<string, { count: number; expires: number }>();
  return async (
    mode: CheckoutMode,
    key: string,
    limit = 8,
    windowSeconds = 600,
  ) => {
    const url = env.KV_REST_API_URL?.trim();
    const token = env.KV_REST_API_TOKEN?.trim();
    const sharedRequired =
      mode === "live" || env.NODE_ENV === "production" || !!env.VERCEL;
    if (url || token || sharedRequired) {
      try {
        if (!url || !token || new URL(url).protocol !== "https:")
          throw unavailable();
        const namespace = env.VERCEL_ENV || env.NODE_ENV || "local";
        const prefix = `influencey:payments:v1:${namespace}:${mode}:${limit}:${windowSeconds}`;
        let client = clients.get(prefix);
        if (!client) {
          client = factory(url, token, prefix, limit, windowSeconds);
          clients.set(prefix, client);
        }
        const result = await client.limit(key);
        // Upstash's default timeout result permits requests. Never accept that
        // fail-open result for payment endpoints, even if success is true.
        if (result.reason === "timeout") throw unavailable();
        if (!result.success)
          throw new PaymentError(
            429,
            "Too many payment attempts. Please try again later.",
          );
        return;
      } catch (error) {
        if (error instanceof PaymentError) throw error;
        // Never return/log provider errors, which may contain Redis credentials.
        throw unavailable();
      }
    }
    const now = Date.now();
    for (const [id, bucket] of buckets)
      if (bucket.expires <= now) buckets.delete(id);
    const id = `${mode}:${limit}:${windowSeconds}:${key}`;
    let bucket = buckets.get(id);
    if (!bucket) {
      if (buckets.size >= 10000)
        throw new PaymentError(
          429,
          "Too many payment attempts. Please try again later.",
        );
      bucket = { count: 0, expires: now + windowSeconds * 1000 };
      buckets.set(id, bucket);
    }
    if (++bucket.count > limit)
      throw new PaymentError(
        429,
        "Too many payment attempts. Please try again later.",
      );
  };
}

export const paymentRateLimit = createPaymentRateLimiter();

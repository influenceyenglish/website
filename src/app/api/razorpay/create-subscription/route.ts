import { NextRequest } from "next/server";
import { createCheckoutSchema, PaymentError } from "@/lib/payments/types";
import {
  browserSession,
  setSession,
  requireOrigin,
  readJSON,
  json,
  errorResponse,
  services,
} from "@/lib/payments/http";
import { hash } from "@/lib/payments/signatures";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  const session = browserSession(request);
  try {
    requireOrigin(request);
    const parsed = createCheckoutSchema.safeParse(await readJSON(request));
    if (!parsed.success)
      throw new PaymentError(
        400,
        "Choose a plan, enter a valid name/email and accept the membership terms.",
      );
    const { config, store, service } = services();
    await store.rateLimit(
      `create-ip:${hash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown")}`,
      20,
    );
    await store.rateLimit(`create-session:${session.hash}`, 10);
    const attempt = await service.create(parsed.data, session.hash);
    return setSession(
      json({
        requestId: attempt.id,
        subscriptionId: attempt.subscription_id,
        keyId: config.keyId,
        mode: config.mode,
        plan: attempt.plan,
      }),
      session.token,
    );
  } catch (error) {
    return setSession(errorResponse(error), session.token);
  }
}

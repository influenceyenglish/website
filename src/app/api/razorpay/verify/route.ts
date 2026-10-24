import { NextRequest } from "next/server";
import { z } from "zod";
import { verifyCheckoutSchema, PaymentError } from "@/lib/payments/types";
import {
  browserSession,
  requireOrigin,
  readJSON,
  json,
  errorResponse,
  services,
  requireFresh,
} from "@/lib/payments/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const session = browserSession(request);
    if (!session.exists)
      throw new PaymentError(
        401,
        "Your checkout session is missing. Please contact support if you paid.",
      );
    const parsed = verifyCheckoutSchema.safeParse(await readJSON(request));
    if (!parsed.success)
      throw new PaymentError(400, "Invalid checkout verification details.");
    const { service } = services();
    const attempt = await service.boundAttempt(
      parsed.data.requestId,
      session.hash,
    );
    requireFresh(attempt.created_at);
    return json(await service.verify(parsed.data, session.hash));
  } catch (error) {
    return errorResponse(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    const session = browserSession(request);
    if (!session.exists)
      throw new PaymentError(
        401,
        "No payment session was found in this browser.",
      );
    const id = z
      .uuid()
      .safeParse(request.nextUrl.searchParams.get("requestId"));
    if (!id.success)
      throw new PaymentError(400, "A checkout reference is required.");
    const { store, service } = services();
    const attempt = await service.boundAttempt(id.data, session.hash);
    requireFresh(attempt.created_at);
    const paymentStatus = await store.status(attempt);
    return json(paymentStatus);
  } catch (error) {
    return errorResponse(error);
  }
}

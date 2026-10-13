import { NextRequest } from "next/server";
import { services, readBody, json, errorResponse } from "@/lib/payments/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const raw = await readBody(request, 1_048_576);
    const { service } = services();
    return json(
      await service.webhook(
        raw,
        request.headers.get("x-razorpay-signature"),
        request.headers.get("x-razorpay-event-id"),
      ),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

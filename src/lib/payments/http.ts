import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { PaymentError } from "./types";
import { newSessionToken, hash } from "./signatures";
import { paymentConfig, PaymentConfigurationError } from "./config";
import { postgresDatabase } from "./database";
import { PaymentStore } from "./store";
import { PaymentService } from "./service";
import { RazorpayGateway } from "./gateway";
export const cookieName =
  process.env.NODE_ENV === "production"
    ? "__Host-influencey-checkout"
    : "influencey-checkout";
export function browserSession(request: NextRequest) {
  const current = request.cookies.get(cookieName)?.value;
  const token =
    current && /^[a-f0-9]{64}$/.test(current) ? current : newSessionToken();
  return { token, hash: hash(token), exists: token === current };
}
export function setSession(response: NextResponse, token: string) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return response;
}
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function errorResponse(error: unknown) {
  if (error instanceof PaymentConfigurationError) {
    console.error("payment_configuration_invalid", {
      code: error.code,
      action: error.operatorMessage,
    });
    return json({ error: error.message, code: error.code }, error.status);
  }
  if (error instanceof PaymentError)
    return json({ error: error.message }, error.status);
  console.error("payment_request_failed");
  return json(
    {
      error:
        "Payment service is temporarily unavailable. Please contact support if you paid.",
    },
    503,
  );
}
export function requireOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const configured = process.env.APP_URL;
  let expected = configured ? new URL(configured).origin : null;
  if (
    !expected &&
    process.env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1"].includes(request.nextUrl.hostname)
  )
    expected = request.nextUrl.origin;
  if (!expected)
    throw new PaymentError(503, "Checkout origin is not configured.");
  if (origin !== expected)
    throw new PaymentError(
      403,
      "This payment request must come from this website.",
    );
}
export async function readBody(request: Request, maxBytes = 16_384) {
  if (Number(request.headers.get("content-length") || 0) > maxBytes)
    throw new PaymentError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new PaymentError(413, "Request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function readJSON(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new PaymentError(415, "Send application/json.");
  try {
    return JSON.parse((await readBody(request)).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    throw new PaymentError(400, "Invalid JSON.");
  }
}
export function services() {
  const config = paymentConfig();
  const store = new PaymentStore(
    postgresDatabase(config.databaseUrl),
    config.mode,
  );
  return {
    config,
    store,
    service: new PaymentService(config, store, new RazorpayGateway(config)),
  };
}
export function requireFresh(createdAt: Date) {
  if (new Date(createdAt).getTime() + 86400_000 < Date.now())
    throw new PaymentError(
      410,
      "This checkout session has expired. Contact support if you paid.",
    );
}

// Share validation, rate limits and durable duplicate protection with the
// original endpoint, which remains available for existing clients.
export { POST } from "../create-subscription/route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

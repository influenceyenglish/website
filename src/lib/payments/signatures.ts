import {
  createHmac,
  createHash,
  timingSafeEqual,
  randomBytes,
} from "node:crypto";
export function hash(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}
export function newSessionToken() {
  return randomBytes(32).toString("hex");
}
export function validSignature(
  message: string | Buffer,
  signature: string | null,
  secret: string,
) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  const supplied = Buffer.from(signature, "hex");
  return (
    supplied.length === expected.length && timingSafeEqual(expected, supplied)
  );
}
export function verifyCheckoutSignature(
  paymentId: string,
  serverSubscriptionId: string,
  signature: string,
  secret: string,
) {
  return validSignature(
    `${paymentId}|${serverSubscriptionId}`,
    signature,
    secret,
  );
}

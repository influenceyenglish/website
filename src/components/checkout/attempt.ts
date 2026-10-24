type Contact = { name: string; email: string; phone: string };

/** Same details reuse the attempt; edited details never reopen an older checkout. */
export async function checkoutAttemptId(
  plan: string,
  contact: Contact,
  mode: "test" | "live" = "test",
) {
  const digits = contact.phone.replace(/[\s()-]/g, "");
  const phone = digits.startsWith("+")
    ? digits
    : `+${digits.length === 10 ? "91" : ""}${digits}`;
  const details = JSON.stringify([
    mode,
    plan,
    contact.name.trim(),
    contact.email.trim().toLowerCase(),
    phone,
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(details),
  );
  const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const key = `ie_checkout_v2_${fingerprint}`;
  const id = sessionStorage.getItem(key) || crypto.randomUUID();
  sessionStorage.setItem(key, id);
  sessionStorage.setItem("ie_latest_attempt", id);
  return id;
}

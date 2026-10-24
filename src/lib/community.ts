/** Shared validation for the website button and the welcome email. */
export function communityInvite(value: string | undefined) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" &&
      url.hostname === "chat.whatsapp.com" &&
      !url.username &&
      !url.password &&
      url.pathname.length > 1
      ? url.href
      : null;
  } catch {
    return null;
  }
}

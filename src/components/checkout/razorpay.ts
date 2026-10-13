export type CheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};
export type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
  handler: (response: CheckoutResponse) => void;
  modal: { ondismiss: () => void };
  retry: { enabled: boolean };
};
type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: { error?: { description?: string } }) => void,
  ) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
let loading: Promise<void> | undefined;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timeout = setTimeout(() => {
      script.remove();
      loading = undefined;
      reject(
        new Error(
          "Checkout took too long to load. Check your connection and try again.",
        ),
      );
    }, 15000);
    script.onload = () => {
      clearTimeout(timeout);
      if (window.Razorpay) resolve();
      else {
        loading = undefined;
        reject(new Error("Checkout could not be loaded. Please try again."));
      }
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      loading = undefined;
      reject(
        new Error(
          "Unable to load Razorpay Checkout. Check your connection or contact support.",
        ),
      );
    };
    document.body.appendChild(script);
  });
  return loading;
}

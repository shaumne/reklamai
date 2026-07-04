import type { ProductKey } from "./products";

export type CheckoutArgs = {
  userId: string;
  email: string;
  productKey: ProductKey;
  successUrl: string;
};

export interface PaymentProvider {
  readonly name: "polar" | "stripe";
  createCheckoutUrl(args: CheckoutArgs): Promise<string>;
  customerPortalUrl(userId: string, returnUrl: string): Promise<string | null>;
}

export function paymentsEnabled(): boolean {
  const provider = process.env.PAYMENT_PROVIDER ?? "none";
  if (provider === "polar") {
    return process.env.POLAR_ENABLED === "true" && Boolean(process.env.POLAR_ACCESS_TOKEN);
  }
  if (provider === "stripe") {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }
  return false;
}

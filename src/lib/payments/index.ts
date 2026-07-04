import type { PaymentProvider } from "./types";
import { polarProvider } from "./polar";
import { stripeProvider } from "./stripe";

export { paymentsEnabled } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER ?? "polar";
  return provider === "stripe" ? stripeProvider : polarProvider;
}

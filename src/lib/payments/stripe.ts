import Stripe from "stripe";
import type { CheckoutArgs, PaymentProvider } from "./types";
import { providerProductId, productByKey } from "./products";

// Dormant adapter: activated with PAYMENT_PROVIDER=stripe + STRIPE_* env.
// Kept in lockstep with the Polar flow so switching providers is config-only.

function stripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createCheckoutUrl(args: CheckoutArgs): Promise<string> {
    const priceId = providerProductId(args.productKey);
    if (!priceId) throw new Error(`no stripe price configured for ${args.productKey}`);

    const product = productByKey(args.productKey);
    const stripe = stripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: product?.type === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: args.email,
      client_reference_id: args.userId,
      success_url: args.successUrl,
      cancel_url: args.successUrl,
      metadata: { user_id: args.userId, product_key: args.productKey },
    });
    if (!session.url) throw new Error("stripe returned no checkout url");
    return session.url;
  },

  async customerPortalUrl(userId: string, returnUrl: string): Promise<string | null> {
    const stripe = stripeClient();
    const customers = await stripe.customers.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 1,
    });
    const customer = customers.data[0];
    if (!customer) return null;

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });
    return portal.url;
  },
};

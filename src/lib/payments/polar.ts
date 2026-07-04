import { Polar } from "@polar-sh/sdk";
import type { CheckoutArgs, PaymentProvider } from "./types";
import { providerProductId } from "./products";

function polarClient() {
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}

export const polarProvider: PaymentProvider = {
  name: "polar",

  async createCheckoutUrl(args: CheckoutArgs): Promise<string> {
    const productId = providerProductId(args.productKey);
    if (!productId) throw new Error(`no polar product configured for ${args.productKey}`);

    const polar = polarClient();
    const session = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: args.userId,
      customerEmail: args.email,
      successUrl: args.successUrl,
      metadata: { user_id: args.userId, product_key: args.productKey },
    });
    return session.url;
  },

  async customerPortalUrl(userId: string, returnUrl: string): Promise<string | null> {
    try {
      const polar = polarClient();
      const session = await polar.customerSessions.create({
        externalCustomerId: userId,
      });
      void returnUrl;
      return session.customerPortalUrl ?? null;
    } catch {
      return null;
    }
  },
};

"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { startCheckout } from "@/lib/actions/billing";
import type { ProductKey } from "@/lib/payments/products";

function errorMessage(
  code: string,
  t: (key: string) => string,
  tCreate: (key: string) => string,
): string {
  switch (code) {
    case "PAYMENTS_DISABLED":
      return t("paymentsSoon");
    case "SUBSCRIPTION_REQUIRED":
      return t("subscriptionRequired");
    default:
      return tCreate("errGeneric");
  }
}

export function SubscribeButton({
  productKey,
  disabled,
  size = "md",
  children,
}: {
  productKey: ProductKey;
  disabled?: boolean;
  size?: ButtonProps["size"];
  children: ReactNode;
}) {
  const t = useTranslations("billing");
  const tCreate = useTranslations("create");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const result = await startCheckout(productKey);
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }

    setError(errorMessage(result.error, t, tCreate));
    setPending(false);
  }

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <Button
        variant="primary"
        size={size}
        onClick={handleClick}
        disabled={disabled || pending}
        className="w-full justify-center"
      >
        {pending ? <Spinner className="border-white/40 border-t-white" /> : children}
      </Button>
      {error ? (
        <p className="text-xs text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

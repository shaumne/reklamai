"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { openCustomerPortal } from "@/lib/actions/billing";

export function PortalButton({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("billing");
  const tCreate = useTranslations("create");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const result = await openCustomerPortal();
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }

    setError(tCreate("errGeneric"));
    setPending(false);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled || pending}>
        {pending ? <Spinner /> : t("manageSubscription")}
      </Button>
      {error ? (
        <p className="text-xs text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

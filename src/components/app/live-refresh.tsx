"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export function LiveRefresh({ ids, active }: { ids: string[]; active: boolean }) {
  const router = useRouter();
  const idsKey = ids.join(",");

  useEffect(() => {
    if (!active || !idsKey) return;

    const supabase = createClient();
    const channel = supabase
      .channel("gen-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generations",
          filter: `id=in.(${idsKey})`,
        },
        () => router.refresh(),
      )
      .subscribe();

    const interval = setInterval(() => router.refresh(), 8000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [active, idsKey, router]);

  return null;
}

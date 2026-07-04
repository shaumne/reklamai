"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function SettingsForm({
  initialDisplayName,
  userId,
}: {
  initialDisplayName: string;
  userId: string;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", userId);
      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // network error: leave the form as-is so the user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:max-w-sm">
      <div>
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving || !userId}>
          {tCommon("save")}
        </Button>
        {saved && <span className="text-sm font-medium text-moss-700">{t("saved")}</span>}
      </div>
    </div>
  );
}

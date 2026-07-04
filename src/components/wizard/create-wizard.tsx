"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  Type,
  Image as ImageIcon,
  Film,
  UploadCloud,
  CircleCheckBig,
  Lock,
  Check,
  TriangleAlert,
  Wand2,
  ArrowLeft,
  ArrowRight,
  Mic,
  Music as MusicIcon,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadTicket } from "@/lib/actions/uploads";
import { createGeneration } from "@/lib/actions/generations";
import type { CreateGenerationInput } from "@/lib/validation/generation";
import {
  AD_CATEGORIES,
  categoryById,
  buildVoiceoverScript,
  type AdCategory,
  type CategoryGroup,
} from "@/lib/ads/categories";
import { PLATFORM_PRESETS, platformById } from "@/lib/ads/platforms";
import { computeCredits, planAtLeast, type ModelCatalogRow, type PlanTier } from "@/lib/credits";
import { planByTier } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/wizard/step-header";
import { SelectableCard, selectableCardClasses } from "@/components/wizard/selectable-card";
import { ToggleSwitch } from "@/components/wizard/toggle-switch";
import { CostSummaryRow } from "@/components/wizard/cost-summary";
import { getDomainIcon } from "@/components/wizard/wizard-icons";

type Mode = CreateGenerationInput["kind"];

type UploadedAsset = {
  id: string;
  previewUrl: string;
  mime: string;
};

type VoiceoverState = {
  enabled: boolean;
  modelId: string;
  voice: string;
  // null until the user edits the script by hand; while null the script is
  // derived live from the category template.
  scriptOverride: string | null;
};

type MusicState = {
  enabled: boolean;
  modelId: string;
  // null until the user edits the style by hand; while null the style is
  // derived live from the category's default music style.
  stylePromptOverride: string | null;
};

export type CreateWizardProps = {
  models: ModelCatalogRow[];
  balance: number;
  planTier: PlanTier;
  locale: "tr" | "en";
};

const VOICE_OPTIONS = ["Rachel", "Adam", "Bella", "Antoni"];

const MODE_OPTIONS: Array<{
  mode: Mode;
  icon: typeof Type;
  titleKey: string;
  descKey: string;
}> = [
  { mode: "video_t2v", icon: Type, titleKey: "modeT2v", descKey: "modeT2vDesc" },
  { mode: "video_i2v", icon: ImageIcon, titleKey: "modeI2v", descKey: "modeI2vDesc" },
  { mode: "video_v2v", icon: Film, titleKey: "modeV2v", descKey: "modeV2vDesc" },
];

export function CreateWizard({ models, balance, planTier, locale }: CreateWizardProps) {
  const t = useTranslations("create");
  const tCommon = useTranslations("common");
  const tLanding = useTranslations("landing");
  const tCategories = useTranslations("categories");
  const tGroups = useTranslations("categoryGroups");
  const tPlatforms = useTranslations("platforms");
  const router = useRouter();

  const [step, setStep] = useState(0);

  const [mode, setMode] = useState<Mode | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [campaign, setCampaign] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [withAudio, setWithAudio] = useState(false);

  const [voiceover, setVoiceover] = useState<VoiceoverState>({
    enabled: false,
    modelId: "",
    voice: VOICE_OPTIONS[0],
    scriptOverride: null,
  });
  const [music, setMusic] = useState<MusicState>({
    enabled: false,
    modelId: "",
    stylePromptOverride: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = categoryId ? categoryById(categoryId) : undefined;
  const platform = platformId ? platformById(platformId) : undefined;

  const categoryGroups = useMemo(() => {
    const map = new Map<CategoryGroup, AdCategory[]>();
    for (const cat of AD_CATEGORIES) {
      const list = map.get(cat.group) ?? [];
      list.push(cat);
      map.set(cat.group, list);
    }
    return Array.from(map.entries());
  }, []);

  const videoModels = useMemo(() => models.filter((m) => m.kind === mode), [models, mode]);
  const availableModels = useMemo(() => {
    if (!platform) return videoModels;
    return videoModels.filter(
      (m) => !m.aspect_ratios || m.aspect_ratios.includes(platform.aspectRatio),
    );
  }, [videoModels, platform]);
  const selectedModel = useMemo(
    () => availableModels.find((m) => m.id === modelId),
    [availableModels, modelId],
  );

  const durationOptions = useMemo(() => {
    if (!selectedModel) return [];
    const base = selectedModel.durations ?? [];
    if (!platform) return base;
    const intersected = base.filter((d) => platform.preferredDurations.includes(d));
    return intersected.length > 0 ? intersected : base;
  }, [selectedModel, platform]);
  const planMaxDuration = planByTier(planTier)?.maxDurationSeconds ?? 12;
  const allowedDurations = useMemo(
    () => durationOptions.filter((d) => d <= planMaxDuration),
    [durationOptions, planMaxDuration],
  );
  // Falls back to the first valid option whenever the stored pick no longer
  // matches the current model/platform pairing, without needing an effect.
  const effectiveDurationSeconds =
    durationSeconds !== null && allowedDurations.includes(durationSeconds)
      ? durationSeconds
      : (allowedDurations[0] ?? null);

  const ttsModels = useMemo(() => models.filter((m) => m.kind === "tts"), [models]);
  const musicModels = useMemo(() => models.filter((m) => m.kind === "music"), [models]);
  const effectiveVoiceoverModelId = voiceover.modelId || ttsModels[0]?.id || "";
  const effectiveMusicModelId = music.modelId || musicModels[0]?.id || "";
  const selectedTtsModel = useMemo(
    () => ttsModels.find((m) => m.id === effectiveVoiceoverModelId),
    [ttsModels, effectiveVoiceoverModelId],
  );
  const selectedMusicModel = useMemo(
    () => musicModels.find((m) => m.id === effectiveMusicModelId),
    [musicModels, effectiveMusicModelId],
  );
  const effectiveVoiceoverScript =
    voiceover.scriptOverride ??
    (category ? buildVoiceoverScript(category, { productName, description, campaign }, locale) : "");
  const effectiveMusicStyle = music.stylePromptOverride ?? (category ? category.musicStyle : "");

  const TIER_LABELS: Record<ModelCatalogRow["tier"], string> = {
    budget: t("tierBudget"),
    standard: t("tierStandard"),
    premium: t("tierPremium"),
    ultra: t("tierUltra"),
  };

  const PLAN_LABELS: Record<PlanTier, string> = {
    free: tLanding("planFreeName"),
    starter: tLanding("planStarterName"),
    pro: tLanding("planProName"),
    business: tLanding("planBusinessName"),
  };

  const MODE_LABELS: Record<Mode, string> = {
    video_t2v: t("modeT2v"),
    video_i2v: t("modeI2v"),
    video_v2v: t("modeV2v"),
  };

  useEffect(() => {
    return () => {
      if (uploadedAsset?.previewUrl) URL.revokeObjectURL(uploadedAsset.previewUrl);
    };
  }, [uploadedAsset]);

  const costVideo =
    selectedModel && effectiveDurationSeconds
      ? computeCredits({ model: selectedModel, durationSeconds: effectiveDurationSeconds, withAudio })
      : 0;
  const costVoiceover =
    voiceover.enabled && selectedTtsModel
      ? computeCredits({
          model: selectedTtsModel,
          characters: Math.max(effectiveVoiceoverScript.length, 1),
        })
      : 0;
  const musicSeconds = Math.max(effectiveDurationSeconds ?? 5, 10);
  const costMusic =
    music.enabled && selectedMusicModel
      ? computeCredits({ model: selectedMusicModel, minutes: musicSeconds / 60 })
      : 0;
  const costTotal = costVideo + costVoiceover + costMusic;
  const balanceAfter = balance - costTotal;

  const canContinueStep0 = mode !== null && (mode === "video_t2v" || uploadedAsset !== null);
  const canContinueStep1 =
    productName.trim().length > 0 &&
    categoryId !== null &&
    platformId !== null &&
    Boolean(selectedModel) &&
    effectiveDurationSeconds !== null;
  const canContinueStep2 =
    (!voiceover.enabled || effectiveVoiceoverScript.trim().length > 0) &&
    (!music.enabled || effectiveMusicStyle.trim().length > 0);
  const canContinue = [canContinueStep0, canContinueStep1, canContinueStep2, true][step];
  const canSubmit = canContinueStep0 && canContinueStep1 && canContinueStep2;

  function handleSelectMode(next: Mode) {
    if (next !== mode) {
      setMode(next);
      setUploadedAsset(null);
      setUploadError(null);
      setModelId(null);
      setDurationSeconds(null);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    try {
      const ticket = await createUploadTicket({ mime: file.type, sizeBytes: file.size });
      if (!ticket.ok) {
        setUploadError(t("errGeneric"));
        return;
      }
      const supabase = createClient();
      const { error: uploadErr } = await supabase.storage
        .from("uploads")
        .uploadToSignedUrl(ticket.path, ticket.token, file);
      if (uploadErr) {
        setUploadError(t("errGeneric"));
        return;
      }
      setUploadedAsset({
        id: ticket.assetId,
        previewUrl: URL.createObjectURL(file),
        mime: file.type,
      });
    } catch {
      setUploadError(t("errGeneric"));
    } finally {
      setUploading(false);
    }
  }

  function regenerateScript() {
    setVoiceover((v) => ({ ...v, scriptOverride: null }));
  }

  function errorMessage(code: string): string {
    if (code === "INSUFFICIENT_CREDITS") return t("errINSUFFICIENT_CREDITS");
    if (code === "PLAN_REQUIRED") return t("errPLAN_REQUIRED");
    if (code === "SUBMIT_FAILED") return t("errSUBMIT_FAILED");
    if (code === "INPUT_MEDIA_REQUIRED") return t("errINPUT_MEDIA_REQUIRED");
    return t("errGeneric");
  }

  async function handleSubmit() {
    if (!selectedModel || !mode || !categoryId || !platformId || !effectiveDurationSeconds) return;
    setSubmitting(true);
    setError(null);
    try {
      const input: CreateGenerationInput = {
        kind: mode,
        modelId: selectedModel.id,
        categoryId,
        platformId,
        productName: productName.trim(),
        description: description.trim() || undefined,
        campaign: campaign.trim() || undefined,
        durationSeconds: effectiveDurationSeconds,
        withAudio: withAudio || undefined,
        inputAssetId: uploadedAsset?.id,
        voiceover:
          voiceover.enabled && selectedTtsModel
            ? { modelId: selectedTtsModel.id, voice: voiceover.voice, script: effectiveVoiceoverScript }
            : undefined,
        music:
          music.enabled && selectedMusicModel
            ? { modelId: selectedMusicModel.id, stylePrompt: effectiveMusicStyle }
            : undefined,
      };
      const result = await createGeneration(input);
      if (result.ok) {
        router.push(`/videos/${result.generationIds[0]}`);
        return;
      }
      setError(result.error);
    } catch {
      setError("SUBMIT_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  function renderSource() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t("modeTitle")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {MODE_OPTIONS.map(({ mode: optMode, icon: Icon, titleKey, descKey }) => (
              <SelectableCard
                key={optMode}
                selected={mode === optMode}
                onClick={() => handleSelectMode(optMode)}
                icon={<Icon className="size-5" />}
                title={t(titleKey)}
                description={t(descKey)}
              />
            ))}
          </div>
        </div>

        {mode && mode !== "video_t2v" && (
          <div>
            {!uploadedAsset ? (
              <>
                <label
                  htmlFor="wizard-upload"
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center transition-colors duration-200",
                    "hover:border-flame-300 hover:bg-flame-50/40",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flame-500",
                    uploading ? "pointer-events-none opacity-70" : "cursor-pointer",
                  )}
                >
                  {uploading ? (
                    <>
                      <Spinner className="size-6" />
                      <span className="text-sm font-medium text-ink-600">{t("uploading")}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-8 text-ink-400" />
                      <span className="text-sm font-medium text-ink-700">{t("uploadTitle")}</span>
                      <span className="text-xs text-ink-400">{t("uploadHint")}</span>
                    </>
                  )}
                  <input
                    id="wizard-upload"
                    type="file"
                    accept={mode === "video_i2v" ? "image/*" : "video/*"}
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                {uploadError && <p className="mt-2 text-sm text-danger-700">{uploadError}</p>}
              </>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-ink-100">
                {uploadedAsset.mime.startsWith("video") ? (
                  <video
                    src={uploadedAsset.previewUrl}
                    className="max-h-80 w-full bg-ink-900 object-contain"
                    controls
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={uploadedAsset.previewUrl}
                    alt={productName || t("uploadTitle")}
                    className="max-h-80 w-full object-contain"
                  />
                )}
                <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-white p-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-moss-700">
                    <CircleCheckBig className="size-4" />
                    {t("uploadTitle")}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedAsset(null)}
                  >
                    {t("uploadChange")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderStyle() {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="productName">
              {t("productName")} <span className="text-flame-500">*</span>
            </Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t("productNamePlaceholder")}
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              maxLength={500}
            />
          </div>
          <div>
            <Label htmlFor="campaign">{t("campaign")}</Label>
            <Input
              id="campaign"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder={t("campaignPlaceholder")}
              maxLength={200}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900">{t("categoryTitle")}</h3>
          <div className="space-y-5">
            {categoryGroups.map(([group, cats]) => (
              <div key={group}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                  {tGroups(group)}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {cats.map((cat) => {
                    const Icon = getDomainIcon(cat.icon);
                    return (
                      <SelectableCard
                        key={cat.id}
                        selected={categoryId === cat.id}
                        onClick={() => setCategoryId(cat.id)}
                        icon={<Icon className="size-4" />}
                        title={tCategories(cat.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink-900">{t("platformTitle")}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PLATFORM_PRESETS.map((p) => {
              const Icon = getDomainIcon(p.icon);
              return (
                <SelectableCard
                  key={p.id}
                  selected={platformId === p.id}
                  onClick={() => setPlatformId(p.id)}
                  icon={<Icon className="size-5" />}
                  title={tPlatforms(p.id)}
                  description={tPlatforms(`${p.id}-desc`)}
                />
              );
            })}
          </div>
        </div>

        {platform && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-900">{t("modelTitle")}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableModels.map((m) => {
                const locked = !planAtLeast(planTier, m.min_plan);
                const isSelected = modelId === m.id;
                const previewDuration = effectiveDurationSeconds ?? m.durations?.[0] ?? 5;
                const credits = computeCredits({
                  model: m,
                  durationSeconds: previewDuration,
                  withAudio,
                });
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={locked}
                    aria-pressed={isSelected}
                    onClick={() => setModelId(m.id)}
                    className={selectableCardClasses(isSelected, locked)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={isSelected ? "flame" : "neutral"}>{TIER_LABELS[m.tier]}</Badge>
                      {locked ? (
                        <Lock className="size-4 text-ink-400" />
                      ) : isSelected ? (
                        <Check className="size-4 text-flame-500" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-ink-900">{m.label}</p>
                    {locked ? (
                      <p className="mt-1 text-xs text-ink-500">
                        {t("planLocked", { plan: PLAN_LABELS[m.min_plan] })}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium text-flame-600">
                        {credits} {tCommon("credits")}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedModel && (
              <div className="mt-5">
                <Label>{t("duration")}</Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((d) => {
                    const durationLocked = d > planMaxDuration;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={durationLocked}
                        onClick={() => setDurationSeconds(d)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
                          durationLocked
                            ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300"
                            : "hover:border-flame-300 active:scale-[0.97]",
                          !durationLocked && effectiveDurationSeconds === d
                            ? "border-flame-500 bg-flame-500 text-white"
                            : !durationLocked
                              ? "border-ink-200 bg-white text-ink-700"
                              : "",
                        )}
                      >
                        {durationLocked && <Lock className="size-3.5" />}
                        {d}
                        {t("seconds")}
                      </button>
                    );
                  })}
                </div>
                {durationOptions.some((d) => d > planMaxDuration) && (
                  <p className="mt-2 text-xs text-ink-400">{t("durationLockedHint")}</p>
                )}
              </div>
            )}

            {selectedModel &&
              (selectedModel.audio_unit_price_usd != null || selectedModel.native_audio) && (
                <label className="group mt-5 flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 select-none">
                  <input
                    type="checkbox"
                    checked={withAudio}
                    onChange={(e) => setWithAudio(e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-5 items-center justify-center rounded-md border transition-colors duration-150",
                      "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flame-500",
                      withAudio
                        ? "border-flame-500 bg-flame-500 text-white"
                        : "border-ink-300 bg-white group-hover:border-flame-300",
                    )}
                  >
                    {withAudio && <Check className="size-3.5" />}
                  </span>
                  {t("withAudio")}
                </label>
              )}
          </div>
        )}
      </div>
    );
  }

  function renderExtras() {
    return (
      <div className="space-y-6">
        {ttsModels.length > 0 && (
          <div className="space-y-4">
            <ToggleSwitch
              id="voiceover-toggle"
              checked={voiceover.enabled}
              onChange={(checked) => setVoiceover((v) => ({ ...v, enabled: checked }))}
              label={t("voiceoverTitle")}
              description={t("voiceoverDesc")}
              icon={<Mic className="size-4" />}
            />
            {voiceover.enabled && (
              <Card className="animate-rise">
                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {ttsModels.map((m) => (
                      <label
                        key={m.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                          effectiveVoiceoverModelId === m.id
                            ? "border-flame-500 bg-flame-50 text-flame-700"
                            : "border-ink-200 text-ink-700 hover:border-flame-200",
                        )}
                      >
                        <input
                          type="radio"
                          name="voiceover-model"
                          className="accent-flame-500"
                          checked={effectiveVoiceoverModelId === m.id}
                          onChange={() => setVoiceover((v) => ({ ...v, modelId: m.id }))}
                        />
                        {TIER_LABELS[m.tier]}
                      </label>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="voice-select">{t("voice")}</Label>
                    <select
                      id="voice-select"
                      value={voiceover.voice}
                      onChange={(e) => setVoiceover((v) => ({ ...v, voice: e.target.value }))}
                      className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 transition-[border-color,box-shadow] duration-150 hover:border-ink-300 focus:border-flame-400 focus:shadow-[0_0_0_3px_rgba(255,77,43,0.12)] focus:outline-none"
                    >
                      {VOICE_OPTIONS.map((voice) => (
                        <option key={voice} value={voice}>
                          {voice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="voice-script" className="mb-0">
                        {t("voiceScript")}
                      </Label>
                      <button
                        type="button"
                        onClick={regenerateScript}
                        disabled={!category}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-flame-600 transition-colors duration-150 hover:text-flame-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Wand2 className="size-3.5" />
                        {t("generateScript")}
                      </button>
                    </div>
                    <Textarea
                      id="voice-script"
                      value={effectiveVoiceoverScript}
                      onChange={(e) =>
                        setVoiceover((v) => ({ ...v, scriptOverride: e.target.value }))
                      }
                      maxLength={2000}
                      className="mt-1.5"
                    />
                  </div>

                  {selectedTtsModel && (
                    <Badge tone="flame">
                      +{costVoiceover} {tCommon("credits")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {musicModels.length > 0 && (
          <div className="space-y-4">
            <ToggleSwitch
              id="music-toggle"
              checked={music.enabled}
              onChange={(checked) => setMusic((m) => ({ ...m, enabled: checked }))}
              label={t("musicTitle")}
              description={t("musicDesc")}
              icon={<MusicIcon className="size-4" />}
            />
            {music.enabled && (
              <Card className="animate-rise">
                <CardContent className="space-y-4 pt-6">
                  {musicModels.length > 1 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {musicModels.map((m) => (
                        <label
                          key={m.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors duration-150",
                            effectiveMusicModelId === m.id
                              ? "border-flame-500 bg-flame-50 text-flame-700"
                              : "border-ink-200 text-ink-700 hover:border-flame-200",
                          )}
                        >
                          <input
                            type="radio"
                            name="music-model"
                            className="accent-flame-500"
                            checked={effectiveMusicModelId === m.id}
                            onChange={() => setMusic((mu) => ({ ...mu, modelId: m.id }))}
                          />
                          {TIER_LABELS[m.tier]}
                        </label>
                      ))}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="music-style">{t("musicStyle")}</Label>
                    <Input
                      id="music-style"
                      value={effectiveMusicStyle}
                      onChange={(e) =>
                        setMusic((m) => ({ ...m, stylePromptOverride: e.target.value }))
                      }
                      maxLength={300}
                    />
                  </div>

                  {selectedMusicModel && (
                    <Badge tone="flame">
                      +{costMusic} {tCommon("credits")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderReview() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("reviewTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-[7rem_1fr]">
              {uploadedAsset && (
                <div className="h-28 w-full overflow-hidden rounded-xl border border-ink-100 sm:w-28">
                  {uploadedAsset.mime.startsWith("video") ? (
                    <video src={uploadedAsset.previewUrl} className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={uploadedAsset.previewUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-ink-400">{t("modeTitle")}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {mode ? MODE_LABELS[mode] : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">{t("categoryTitle")}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {category ? tCategories(category.id) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">{t("platformTitle")}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {platform ? `${tPlatforms(platform.id)} · ${platform.aspectRatio}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">{t("modelTitle")}</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {selectedModel
                      ? `${selectedModel.label} · ${effectiveDurationSeconds}${t("seconds")}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <CostSummaryRow label={t("costVideo")} value={costVideo} />
            {voiceover.enabled && <CostSummaryRow label={t("costVoiceover")} value={costVoiceover} />}
            {music.enabled && <CostSummaryRow label={t("costMusic")} value={costMusic} />}
            <div className="h-px bg-ink-100" />
            <CostSummaryRow label={t("costTotal")} value={costTotal} bold />
            <div className="h-px bg-ink-100" />
            <CostSummaryRow label={t("balanceCurrent")} value={balance} />
            <CostSummaryRow
              label={t("balanceAfter")}
              value={balanceAfter}
              danger={balanceAfter < 0}
            />
          </CardContent>
        </Card>

        {balanceAfter < 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-danger-100 bg-danger-100/50 p-4 text-sm text-danger-700">
            <TriangleAlert className="mt-0.5 size-5 shrink-0" />
            <p>
              {t("insufficient")}{" "}
              <Link
                href="/billing"
                className="font-semibold underline underline-offset-2 hover:text-danger-500"
              >
                {tCommon("upgrade")}
              </Link>
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-danger-100 bg-danger-100/50 p-4 text-sm text-danger-700">
            {errorMessage(error)}
          </div>
        )}

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={submitting || balanceAfter < 0 || !canSubmit}
          onClick={handleSubmit}
        >
          {submitting && <Spinner className="border-white/40 border-t-white" />}
          {submitting ? t("generating") : t("generate", { credits: costTotal })}
        </Button>
      </div>
    );
  }

  const steps = [t("stepSource"), t("stepStyle"), t("stepExtras"), t("stepReview")];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl text-ink-900 sm:text-4xl">{t("title")}</h1>
      </div>

      <StepHeader steps={steps} currentStep={step} />

      <Card className="p-6 sm:p-8">
        <div key={step} className="animate-rise">
          {step === 0 && renderSource()}
          {step === 1 && renderStyle()}
          {step === 2 && renderExtras()}
          {step === 3 && renderReview()}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink-100 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(0, step - 1))}
            className={step === 0 ? "invisible" : undefined}
          >
            <ArrowLeft className="size-4" />
            {tCommon("back")}
          </Button>
          {step < 3 && (
            <Button type="button" onClick={() => setStep(Math.min(3, step + 1))} disabled={!canContinue}>
              {tCommon("next")}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

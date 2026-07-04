"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

type UploadTicket =
  | { ok: true; assetId: string; path: string; token: string }
  | { ok: false; error: string };

export async function createUploadTicket(args: {
  mime: string;
  sizeBytes: number;
}): Promise<UploadTicket> {
  if (!ALLOWED_MIME.has(args.mime)) return { ok: false, error: "UNSUPPORTED_TYPE" };
  if (args.sizeBytes > 50 * 1024 * 1024) return { ok: false, error: "FILE_TOO_LARGE" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };

  const ext = args.mime.split("/")[1]?.replace("quicktime", "mov") ?? "bin";
  const path = `${user.id}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("uploads")
    .createSignedUploadUrl(path);
  if (signError || !signed) return { ok: false, error: "SIGN_FAILED" };

  const { data: asset, error: assetError } = await admin
    .from("assets")
    .insert({
      user_id: user.id,
      kind: args.mime.startsWith("video") ? "upload_video" : "upload_image",
      bucket: "uploads",
      storage_path: path,
      mime: args.mime,
      size_bytes: args.sizeBytes,
    })
    .select("id")
    .single();
  if (assetError || !asset) return { ok: false, error: "ASSET_FAILED" };

  return { ok: true, assetId: asset.id, path, token: signed.token };
}

export async function getAssetPreviewUrl(assetId: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: asset } = await admin
    .from("assets")
    .select("bucket, storage_path, user_id")
    .eq("id", assetId)
    .single();
  if (!asset || asset.user_id !== user.id) return null;

  const { data } = await admin.storage
    .from(asset.bucket)
    .createSignedUrl(asset.storage_path, 3600);
  return data?.signedUrl ?? null;
}

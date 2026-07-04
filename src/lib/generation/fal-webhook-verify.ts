import { verify as cryptoVerify, createPublicKey, createHash } from "crypto";

type Jwk = { kty: string; crv?: string; x?: string; kid?: string };

let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const url =
    process.env.FAL_WEBHOOK_JWKS_URL ??
    "https://rest.alpha.fal.ai/.well-known/jwks.json";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const body = (await res.json()) as { keys: Jwk[] };
  jwksCache = { keys: body.keys ?? [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

export async function verifyFalWebhook(args: {
  requestId: string | null;
  userId: string | null;
  timestamp: string | null;
  signatureHex: string | null;
  rawBody: Buffer;
}): Promise<boolean> {
  const { requestId, userId, timestamp, signatureHex, rawBody } = args;
  if (!requestId || !userId || !timestamp || !signatureHex) return false;

  // replay window: ±5 minutes
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const message = Buffer.from(
    [requestId, userId, timestamp, bodyHash].join("\n"),
    "utf-8",
  );
  const signature = Buffer.from(signatureHex, "hex");

  let keys: Jwk[];
  try {
    keys = await getJwks();
  } catch {
    return false;
  }

  for (const jwk of keys) {
    if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || !jwk.x) continue;
    try {
      const publicKey = createPublicKey({ key: { ...jwk }, format: "jwk" });
      if (cryptoVerify(null, message, publicKey, signature)) return true;
    } catch {
      // try next key
    }
  }
  return false;
}

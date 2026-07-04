// Generation provider abstraction. fal.ai is the only implementation today;
// a self-hosted worker (e.g. local LTX-2 behind a callback URL) can be added
// by implementing this interface and switching per model_catalog row.

export type SubmitJobInput = {
  modelRef: string; // provider-side model id
  input: Record<string, unknown>;
  webhookUrl: string;
};

export type SubmitJobResult = {
  requestId: string;
};

export type JobStatusResult =
  | { state: "queued" | "processing" }
  | { state: "completed"; payload: Record<string, unknown> }
  | { state: "failed"; error: string };

export interface GenerationProvider {
  submitJob(input: SubmitJobInput): Promise<SubmitJobResult>;
  checkJob(modelRef: string, requestId: string): Promise<JobStatusResult>;
}

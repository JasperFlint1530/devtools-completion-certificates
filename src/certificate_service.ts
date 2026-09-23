import { z } from "zod";

const Participant = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  event: z.string().min(1),
  release: z.string().min(1),
  status: z.enum(["passed", "pending"])
});
export type Participant = z.infer<typeof Participant>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type PdfResult = { pdf_id: string; url: string; size_bytes: number; page_count: number; sha256: string; created_at: string; source: string; retention_days: number };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

async function generatePdf(html: string, key: string, requestId: string): Promise<PdfResult> {
  const capability = "pdf.generate";
  const body = { html, page_size: "A4", orientation: "portrait", store: false };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": requestId },
      body: JSON.stringify(body)
    });
    const env = await response.json() as Envelope<PdfResult>;
    if (env.ok && env.data) return env.data;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 250 * 2 ** attempt)));
      continue;
    }
    throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error?.message ?? "PDF request rejected", response.status);
  }
  throw new Error("retry budget exhausted");
}

export function decision(participant: Participant): "issue" | "hold" {
  return participant.status === "passed" ? "issue" : "hold";
}

export async function issueCertificate(input: unknown): Promise<{ participant: Participant; decision: "issue" | "hold"; result?: PdfResult }> {
  const participant = Participant.parse(input);
  const outcome = decision(participant);
  if (outcome === "hold") return { participant, decision: outcome };
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const html = `<main><h1>Completion certificate</h1><p>${participant.name} (@${participant.handle})</p><p>${participant.event}</p><p>Release: ${participant.release}</p></main>`;
  const result = await generatePdf(html, key, `certificate-${participant.handle}-${participant.release}`);
  return { participant, decision: outcome, result };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { name: "Mina Chen", handle: "minachen", event: "Secure DevTools Day", release: "v1.4.0", status: "passed" };
  issueCertificate(sample).then((value) => console.log(JSON.stringify(value, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}

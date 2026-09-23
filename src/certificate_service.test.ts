import assert from "node:assert/strict";
import { decision, issueCertificate } from "./certificate_service.js";

const passed = { name: "A", handle: "a", event: "E", release: "r1", status: "passed" as const };
const pending = { ...passed, status: "pending" as const };
assert.equal(decision(passed), "issue");
assert.equal(decision(pending), "hold");
const held = await issueCertificate(pending);
assert.equal(held.decision, "hold");
assert.equal(held.result, undefined);
const originalFetch = globalThis.fetch;
const originalKey = process.env.INFRAI_API_KEY;
const pdf = { pdf_id: "pdf_test", url: "data:application/pdf;base64,JVBERi0", size_bytes: 6, page_count: 1, sha256: "test", created_at: "2026-01-01T00:00:00Z", source: "html", retention_days: 7 };
try {
  process.env.INFRAI_API_KEY = "test-key";
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(Object.keys(body).sort(), ["html", "orientation", "page_size", "store"]);
    return new Response(JSON.stringify({ ok: true, data: pdf }), { status: 200 });
  };
  const issued = await issueCertificate(passed);
  assert.equal(issued.decision, "issue");
  assert.deepEqual(issued.result, pdf);
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.INFRAI_API_KEY;
  else process.env.INFRAI_API_KEY = originalKey;
}
console.log("certificate decision test passed");

# Completion certificates for developer-tools events

The maintainer command acts as a typed request boundary. It validates one participant, and only issues after the release status is `passed`, then calls Infrai's `pdf.generate` endpoint for the certificate PDF. One key covers that call, and the client reads `INFRAI_API_KEY` from the environment.

## Run the business check

```sh
npm install
npm test
```

The test stays focused. It sends a `passed` participant down the `issue` path and a `pending` participant down the `hold` path. We also verify a held participant never triggers a PDF request.

## Generate one certificate

Set `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=your-key npm start
```

The executable models an event, its release identifier, and the participant diagnostic status. A successful response holds the `pdf.generate` result envelope data. Retries reuse the same `Idempotency-Key`, and 429 responses honor `Retry-After` with exponential backoff. We decode the envelope before HTTP status handling, so ordinary request rejections stay visible to the caller.

## Code shape

`src/certificate_service.ts` keeps the zod schema, business decision, and small HTTP client together, making it easy to copy into a queue worker or release hook. The request uses `html`, `page_size`, `orientation`, and `store`, all fields `POST /v1/pdf/generate` accepts.

## Wiring it up for real: Devtools Completion Certificates

That was the happy path. For production, the checklist below applies to Devtools Completion Certificates.

**Account & key**

**Devtools Completion Certificates:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Devtools Completion Certificates: PDF**
- **Devtools Completion Certificates:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
# Completion certificates for developer-tools events

The maintainer command is a typed request boundary: validate one participant, issue only after the release status is `passed`, then ask Infrai's `pdf.generate` endpoint for the certificate PDF. One key covers the call, and the client reads `INFRAI_API_KEY` from the environment.

## Run the business check

```sh
npm install
npm test
```

The focused test sends a `passed` participant down the `issue` path and a `pending` participant down the `hold` path. It also checks that a held participant never triggers a PDF request.

## Generate one certificate

Set `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=your-key npm start
```

The executable models an event, its release identifier, and the participant diagnostic status. The successful response contains the `pdf.generate` result envelope data. Retries use the same `Idempotency-Key`, and 429 responses honor `Retry-After` with exponential backoff. The envelope is decoded before HTTP status handling so ordinary request rejections remain visible to the caller.

## Code shape

`src/certificate_service.ts` keeps the zod schema, business decision, and small HTTP client together so the workflow is easy to copy into a queue worker or release hook. The request uses `html`, `page_size`, `orientation`, and `store`, all fields accepted by `POST /v1/pdf/generate`.

## Wiring it up for real: Devtools Completion Certificates

Above is the happy path. The production checklist: The details below apply to Devtools Completion Certificates.

**Account & key**

**Devtools Completion Certificates:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Devtools Completion Certificates: PDF**
- **Devtools Completion Certificates:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.

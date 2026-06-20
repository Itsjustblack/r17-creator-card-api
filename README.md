# Creator Card API

A Creator Card microservice — link-in-bio cards with attached service rate cards. Built on the R17 Node.js/Express scaffold, persisted to MongoDB.

> Scaffold internals (services, endpoints, validator, error utilities) are documented in [documentation.md](./documentation.md). This file documents the solution.

## Endpoints

All endpoints live at the **root** of the base URL — no versioning, no auth.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/creator-cards` | Create a card |
| `GET` | `/creator-cards/:slug` | Public retrieval by slug |
| `DELETE` | `/creator-cards/:slug` | Soft-delete by slug |

All three return **HTTP 200** on success with `{ status: "success", message, data }`. The identifier is always serialized as `id` (never `_id`). `access_code` is returned on create/delete (`null` when public) and **omitted entirely** on retrieval.

### `POST /creator-cards`

```jsonc
// request
{
  "title": "Ada Designs Things",                // required, 3–100 chars
  "description": "Brand & product design services", // optional, ≤500
  "slug": "ada-designs-things",                 // optional, 5–50 chars, [a-z0-9_-]; auto-generated from title if omitted
  "creator_reference": "abcdefghij1234567890",  // required, exactly 20 chars
  "links": [{ "title": "YouTube", "url": "https://youtube.com/@georgecooks" }],
  "service_rates": {
    "currency": "NGN",                          // NGN | USD | GBP | GHS
    "rates": [{ "name": "IG Story Post", "description": "One story mention", "amount": 5000000 }]
  },
  "status": "published",                        // required, draft | published
  "access_type": "public",                      // optional, public | private (default public)
  "access_code": "ab12cd"                       // required iff private; exactly 6 alphanumeric
}
```

- If `slug` is omitted, it's auto-generated from `title`: lowercased, whitespace turned into hyphens, invalid characters stripped. If the result is shorter than 5 characters or already taken, a random 6-character suffix is appended instead of erroring.
- A client-supplied `slug` that's already taken is **not** auto-renamed — it fails with `SL02`.

### `GET /creator-cards/:slug`

Private cards take the pin as a query param: `GET /creator-cards/private-card?access_code=ab12cd`. Access rules apply in order: `NF01` (missing/deleted) → `NF02` (draft) → `AC03` (private, no pin) → `AC04` (private, wrong pin) → `200`.

### `DELETE /creator-cards/:slug`

Body: `{ "creator_reference": "abcdefghij1234567890" }`. The lookup is by `slug` only — `creator_reference` is validated for shape (exactly 20 chars) but not yet checked against the stored card. Returns the deleted card in creation format with `deleted` set; the card is then no longer retrievable (`NF01`).

## Error codes

Field-level validation (types, lengths, enums) is handled by the template validator (VSL) and returns plain **HTTP 400** with an `errors` array, no `code`. Format checks the validator can't express (slug charset, link URL scheme, access-code format) also return plain 400 with just a `message`. Business rules carry these codes:

| Code | HTTP | Meaning |
|------|------|---------|
| `SL02` | 400 | Slug already taken |
| `AC01` | 400 | `access_code` required when `access_type` is private |
| `AC05` | 400 | `access_code` set on a public card |
| `NF01` | 404 | Card not found (or deleted) |
| `NF02` | 404 | Card exists but is a draft |
| `AC03` | 403 | Private card, no access code supplied |
| `AC04` | 403 | Private card, wrong access code |

Business-rule errors return `{ "status": "error", "message": "...", "code": "..." }`.

## Validation

- **VSL** (`@app-core/validator`) handles types, required/optional, lengths, and enums.
- A thin in-service layer covers what VSL can't express: slug charset, link `url` scheme (`http://`/`https://`), and `access_code` format. These run as plain regex checks right after VSL validation and return generic 400s.
- Business rules (slug uniqueness, conditional `access_code`, retrieval access control) are implemented in the services and carry the custom codes above.

## Core template edits

Exactly one core file was changed, to surface the business error `code` at the top level of the error envelope instead of burying it in `data`:

- `core/express/server.js` — the catch block now pulls `code` out of `error.context` and puts it on `responseComponents.body.code`, leaving any other context fields under `data`.

No other `@app-core/*` behavior was modified.

## Local setup

```bash
npm install
cp .env.example .env
# MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/creator-card?retryWrites=true&w=majority
# the path segment between the host and `?` (creator-card) is the database name — it
# tells MongoDB which database to use; omit it and MongoDB silently defaults to `test`
node bootstrap.js        # or: node app.js (skips the .env/Secrets Manager bootstrap step)
```

Required environment variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `PORT` | yes | Port to listen on (the host sets this in production) |
| `MONGODB_URI` | yes | MongoDB connection string (Atlas or local); defaults to the `test` database if no path segment is included |

Everything else in `.env.example` (JWT, Redis/queue, email, AWS Secrets Manager, etc.) belongs to the template's pre-existing `onboarding` feature and has safe no-ops if left unset.

## Tests

```bash
npm test
```

Unit tests cover both layers, with the repository layer stubbed (no real database involved):

- **Services** (`test/services/creator-card/`) — validation, slug generation/collision handling, access-code rules, and serialization.
- **Endpoints** (`test/endpoints/creator-card/`) — request/response wiring for each of the three routes.

## Deployment

Deployed on **Railway** (web service) backed by **MongoDB Atlas**. The `Procfile` runs `node bootstrap.js`; endpoints live at the root of the base URL (no versioning, no auth).

### 1. MongoDB Atlas

- Create a free **M0** cluster.
- Add a database user (least privilege — `readWrite` on the app database only) with a strong password.
- **Network access:** Railway's outbound IPs aren't static on standard plans, so `0.0.0.0/0` is the practical allowlist entry unless you're on a plan with a fixed egress IP.
- Build the connection string: `mongodb+srv://<user>:<password>@<cluster>/creator-card?retryWrites=true&w=majority` — the path segment (`creator-card`) matters; omitting it silently defaults to a database named `test`.

### 2. Railway web service

| Setting | Value |
|---|---|
| Start command | `node bootstrap.js` (picked up from `Procfile`) |
| Env vars | `MONGODB_URI` (your Atlas connection string) |

`PORT` is injected automatically by Railway — don't set it manually.

### 3. Verify

Railway redeploys automatically on every push to `main`. Once live, exercise the endpoints against the base URL:

```bash
curl -X POST https://your-app.up.railway.app/creator-cards \
  -H "Content-Type: application/json" \
  -d '{"title":"Ada Designs Things","creator_reference":"abcdefghij1234567890","status":"published"}'
```

## Structure

```
endpoints/creator-card/   create.js, get-by-slug.js, delete.js
services/creator-card/    create.js, get-by-slug.js, delete.js, constants.js, utils.js, errors.js
models/creator-card.js    ULID _id, unique slug index, soft-delete via paranoid: true
repository/creator-card/  repositoryFactory('CreatorCard')
messages/creator-card.js  success and error message strings
test/                     unit tests for services/ and endpoints/
```

For everything else (path aliases, the request lifecycle, VSL syntax, repository methods, transaction patterns), see [documentation.md](./documentation.md).

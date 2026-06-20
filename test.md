# Creator Card API — HTTPie Test Requests

Docs reference: https://httpie.io/docs/cli/universal
Spec reference: https://assessments.r17.tech

Replace `BASE_URL` with your local server (e.g. `http://localhost:3000`) or the deployed URL.

```
BASE_URL=http://localhost:3000
```

> Note: `id`, `created`, `updated`, and `deleted` values below are dynamic (ULID / epoch ms) — actual values will differ per run. All other fields are deterministic given the request bodies shown.

---

## Valid Cases

### 1. Create a full card with all optional fields (public, published)

**Expected:** `200 OK`

```
http POST $BASE_URL/creator-cards \
  title="Ada Designs Things" \
  description="Brand & product design services" \
  creator_reference="abcdefghij1234567890" \
  status="published" \
  access_type="public" \
  links:='[{"title":"Portfolio","url":"https://ada.design"}]' \
  service_rates:='{"currency":"NGN","rates":[{"name":"Logo Design","description":"Custom logo","amount":50000}]}'
```

**Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01KVK11VQ6RE9VZWDCTK0FGQVM",
    "title": "Ada Designs Things",
    "description": "Brand & product design services",
    "slug": "ada-designs-things",
    "creator_reference": "abcdefghij1234567890",
    "links": [{ "title": "Portfolio", "url": "https://ada.design" }],
    "service_rates": {
      "currency": "NGN",
      "rates": [{ "name": "Logo Design", "description": "Custom logo", "amount": 50000 }]
    },
    "status": "published",
    "access_type": "public",
    "created": 1781976329958,
    "updated": 1781976329958,
    "deleted": null,
    "access_code": null
  }
}
```

---

### 2. Create a card without slug -> auto-generated as "ada-designs-things"

**Expected:** `200 OK` (slug auto-generated from title; suffixed with a random 6-char string if the base slug is already taken)

```
http POST $BASE_URL/creator-cards \
  title="Ada Designs Things" \
  creator_reference="abcdefghij1234567890" \
  status="published"
```

**Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01KVK126A97R37K5HG91H1DXCS",
    "title": "Ada Designs Things",
    "slug": "ada-designs-things-31de0c",
    "creator_reference": "abcdefghij1234567890",
    "status": "published",
    "access_type": "public",
    "links": [],
    "created": 1781976340809,
    "updated": 1781976340809,
    "deleted": null,
    "access_code": null
  }
}
```

---

### 3. Create a private card with a valid 6-char alphanumeric access_code

**Expected:** `200 OK`

```
http POST $BASE_URL/creator-cards \
  title="Private Card" \
  slug="private-card" \
  creator_reference="abcdefghij1234567890" \
  status="published" \
  access_type="private" \
  access_code="ab12cd"
```

**Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01KVK12EYYK14Y0FH5FY5W4T69",
    "title": "Private Card",
    "slug": "private-card",
    "creator_reference": "abcdefghij1234567890",
    "status": "published",
    "access_type": "private",
    "links": [],
    "created": 1781976349662,
    "updated": 1781976349662,
    "deleted": null,
    "access_code": "ab12cd"
  }
}
```

---

### 4. Get a public, published card by slug

**Expected:** `200 OK` (`access_code` field omitted entirely from retrieval responses)

```
http GET $BASE_URL/creator-cards/ada-designs-things
```

**Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "01KVK11VQ6RE9VZWDCTK0FGQVM",
    "title": "Ada Designs Things",
    "description": "Brand & product design services",
    "slug": "ada-designs-things",
    "creator_reference": "abcdefghij1234567890",
    "links": [{ "title": "Portfolio", "url": "https://ada.design" }],
    "service_rates": {
      "currency": "NGN",
      "rates": [{ "name": "Logo Design", "description": "Custom logo", "amount": 50000 }]
    },
    "status": "published",
    "access_type": "public",
    "created": 1781976329958,
    "updated": 1781976329958,
    "deleted": null
  }
}
```

---

### 5. Get a private card supplying the correct access_code

**Expected:** `200 OK` (`access_code` still omitted, even with the correct pin)

```
http GET "$BASE_URL/creator-cards/private-card?access_code=ab12cd"
```

**Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "01KVK12EYYK14Y0FH5FY5W4T69",
    "title": "Private Card",
    "slug": "private-card",
    "creator_reference": "abcdefghij1234567890",
    "status": "published",
    "access_type": "private",
    "links": [],
    "created": 1781976349662,
    "updated": 1781976349662,
    "deleted": null
  }
}
```

---

### 6. Delete a card, supplying the matching creator_reference

**Expected:** `200 OK`, `deleted` timestamp populated

```
http DELETE $BASE_URL/creator-cards/private-card \
  creator_reference="abcdefghij1234567890"
```

**Response — `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Deleted Successfully.",
  "data": {
    "id": "01KVK12EYYK14Y0FH5FY5W4T69",
    "title": "Private Card",
    "slug": "private-card",
    "creator_reference": "abcdefghij1234567890",
    "status": "published",
    "access_type": "private",
    "links": [],
    "created": 1781976349662,
    "updated": 1781976349662,
    "deleted": 1781976368618,
    "access_code": "ab12cd"
  }
}
```

---

## Invalid Cases

### 7. Duplicate slug

**Expected:** `400 Bad Request`, code `SL02`

```
http POST $BASE_URL/creator-cards \
  title="Duplicate Slug Card" \
  slug="ada-designs-things" \
  creator_reference="abcdefghij1234567890" \
  status="published"
```

**Response — `400 Bad Request`**

```json
{
  "status": "error",
  "message": "Slug is already taken",
  "code": "SL02"
}
```

---

### 8. Private card created without access_code

**Expected:** `400 Bad Request`, code `AC01`

```
http POST $BASE_URL/creator-cards \
  title="Missing Access Code" \
  creator_reference="abcdefghij1234567890" \
  status="published" \
  access_type="private"
```

**Response — `400 Bad Request`**

```json
{
  "status": "error",
  "message": "access_code is required when access_type is private",
  "code": "AC01"
}
```

---

### 9. Public card created with an access_code

**Expected:** `400 Bad Request`, code `AC05`

```
http POST $BASE_URL/creator-cards \
  title="Public With Code" \
  creator_reference="abcdefghij1234567890" \
  status="published" \
  access_type="public" \
  access_code="ab12cd"
```

**Response — `400 Bad Request`**

```json
{
  "status": "error",
  "message": "access_code can only be set on private cards",
  "code": "AC05"
}
```

---

### 10. Invalid status enum value

**Expected:** `400 Bad Request` (VSL framework validation failure)

```
http POST $BASE_URL/creator-cards \
  title="Bad Status Card" \
  creator_reference="abcdefghij1234567890" \
  status="not-a-real-status"
```

**Response — `400 Bad Request`**

```json
{
  "status": "error",
  "message": "Expected status's value: not-a-real-status to be one of draft, published",
  "errors": {
    "status": "Expected status's value: not-a-real-status to be one of draft, published",
    "__$app_first_message": "Expected status's value: not-a-real-status to be one of draft, published"
  }
}
```

---

### 11. Get a card that doesn't exist

**Expected:** `404 Not Found`, code `NF01`

```
http GET $BASE_URL/creator-cards/does-not-exist
```

**Response — `404 Not Found`**

```json
{
  "status": "error",
  "message": "Creator card not found",
  "code": "NF01"
}
```

---

### 12. Get a card that is still in draft

**Expected:** create -> `200 OK`; get -> `404 Not Found`, code `NF02`

```
http POST $BASE_URL/creator-cards \
  title="Draft Card" \
  slug="draft-card" \
  creator_reference="abcdefghij1234567890" \
  status="draft"
http GET $BASE_URL/creator-cards/draft-card
```

**Response — create, `200 OK`**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01KVK13X4Z122GKRZK7CF2BRWH",
    "title": "Draft Card",
    "slug": "draft-card",
    "creator_reference": "abcdefghij1234567890",
    "status": "draft",
    "access_type": "public",
    "links": [],
    "created": 1781976396959,
    "updated": 1781976396959,
    "deleted": null,
    "access_code": null
  }
}
```

**Response — get, `404 Not Found`**

```json
{
  "status": "error",
  "message": "Drafts are not publicly retrievable",
  "code": "NF02"
}
```

---

### 13. Get a private card without supplying access_code

**Expected:** `403 Forbidden`, code `AC03`

```
http GET $BASE_URL/creator-cards/private-card
```

**Response — `403 Forbidden`**

```json
{
  "status": "error",
  "message": "Access code required",
  "code": "AC03"
}
```

> Note: if run strictly in this file's order, `private-card` was already deleted in test 6, so this will actually return `404 NF01` instead. Recreate a private card (see test 3) before running this case in isolation to observe the `AC03` response above.

---

### 14. Get a private card with the wrong access_code

**Expected:** `403 Forbidden`, code `AC04`

```
http GET "$BASE_URL/creator-cards/private-card?access_code=wrong1"
```

**Response — `403 Forbidden`**

```json
{
  "status": "error",
  "message": "Invalid access code",
  "code": "AC04"
}
```

> Note: same caveat as test 13 — `private-card` no longer exists at this point in the script, so this will actually return `404 NF01`. Recreate a private card first to observe the `AC04` response above.

---

### 15. Delete a card with a missing/wrong-length creator_reference

**Expected:** `400 Bad Request` (VSL framework validation failure, `length:20`)

```
http DELETE $BASE_URL/creator-cards/ada-designs-things \
  creator_reference="tooshort"
```

**Response — `400 Bad Request`**

```json
{
  "status": "error",
  "message": "Passed creator_reference length 8 should be 20",
  "errors": {
    "creator_reference": "Passed creator_reference length 8 should be 20",
    "__$app_first_message": "Passed creator_reference length 8 should be 20"
  }
}
```

Here is the extracted and formatted content from the assessment page:

# Backend Engineers Wanted - Contract to Full-Time Opportunity

Resilience 17 Venture Studio is seeking exceptional backend engineers. This is a 1-year contract with strong potential for conversion to full-time for candidates who demonstrate outstanding work ethics and execution.

## What We're Looking For

We need engineers who can:

* **Follow instructions carefully** - Strong attention to detail and precision
* **Work efficiently** - Ability to move quickly while maintaining quality
* **Code confidently with AI assistants** - Must be comfortable using GitHub Copilot, Cursor, or similar AI coding tools
* **Master vanilla JavaScript fundamentals** - Strong grasp of core JavaScript concepts (you'll use Express.js for routing, but we value engineers who understand the fundamentals)
* **Take initiative** - Identify and solve problems proactively
* **Produce quality work** - Consistently deliver clean, functional code
* **Start immediately** - We need people available to begin right away

## The Role

You'll be implementing well-defined and thoroughly documented API/backend service contracts and business requirements. This role focuses on precise execution of clear specifications in a fast-paced environment.

**Key Responsibilities:**

* Build robust backend services using Node.js and Express
* Implement API contracts with precision and attention to detail
* Work with MongoDB for data persistence
* Deploy applications on cloud platforms (Heroku/Render)
* Collaborate in an agile team environment
* Report directly to the Engineering Lead

## Essential Requirements

* **Immediate availability** - We need engineers ready to start as soon as possible
* **Node.js (vanilla JavaScript)** and **Express.js** - this is our primary stack
* **MongoDB** experience
* Understanding of RESTful API design and implementation
* Git/GitHub proficiency
* Strong debugging and problem-solving skills
* **Ability to follow project templates and coding standards precisely**
* *Bonus points:* working knowledge of any of PHP, Python, or Java in addition to Node.js

## What We Offer

* 100% remote work
* Flexible schedule - deliverables matter more than hours
* Real conversion opportunity - Exceptional performers will be offered full-time positions
* Fintech/Banking industry exposure - Work on cutting-edge financial technology
* Venture Studio environment - Fast-paced, innovative, entrepreneurial culture

## How to Apply

**DEADLINE: June 24, 2026**
Complete our technical assessment and submit it via this Google form. You must provide:

1. Publicly accessible GitHub repository with your solution
2. Deployed BASE URL only (e.g., `[https://submission.herokuapp.com](https://submission.herokuapp.com)`)

> ⚠️ **Do NOT** include any versioning in your URL - no `/v1`, `/api/v1`, or similar
> ⚠️ **Do NOT** include endpoint paths in your submission
> If your base URL is `[https://submission.herokuapp.com](https://submission.herokuapp.com)`, we will test against `POST [https://submission.herokuapp.com/creator-cards](https://submission.herokuapp.com/creator-cards)`, `GET [https://submission.herokuapp.com/creator-cards/:slug](https://submission.herokuapp.com/creator-cards/:slug)`, and `DELETE [https://submission.herokuapp.com/creator-cards/:slug](https://submission.herokuapp.com/creator-cards/:slug)`

---

# Technical Assessment

**IMPORTANT:** You must use the provided project template: [📦 Backend Template Repository]
**IMPORTANT:** Follow the instructions to the letter.

> The ability to follow instructions precisely is a core part of what this assessment evaluates. A correct, working implementation that did not follow the instructions to the letter will NOT be considered.

Build a Creator Card microservice API that lets creators publish a shareable profile card showcasing their links and service rates (think "link-in-bio" cards with rate cards attached).
*Note: This assessment is a standalone technical exercise. It is not a reflection of the products or domain you will actually work on.*

## Overview

Your task is to create a REST API with three endpoints: one that creates Creator Cards after validating them against the rules below, one that publicly retrieves a card by its slug while respecting draft status and private access controls, and one that deletes a card by its slug.

## The Creator Card Entity

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | string | ULID | Stored as `_id` in MongoDB, but ALWAYS serialized as `id` in API responses |
| `title` | string | 3–100 characters | e.g. "George Cooks" |
| `description` | string | max 500 characters | e.g. "George Cooks is a weekly cooking podcast..." |
| `slug` | string | 5–50 characters; unique; letters, numbers, hyphens and underscores only | Public identifier used for card retrieval |
| `creator_reference` | string | exactly 20 characters | Identifies the creator on the consuming service |
| `links[]` | array | of objects — | Links the creator wants to showcase |
| `links[].title` | string | 1–100 characters | Title of the link |
| `links[].url` | string | max 200 characters; must start with http:// or https:// | Link URL |
| `service_rates` | object | — | Rates offered by the creator for services |
| `service_rates.currency` | string | enum: `NGN` | `USD` | `GBP` | `GHS` | Currency for all rates on the card |
| `service_rates.rates[]` | array | of objects; non-empty if `service_rates` is present | Individual service rates |
| `service_rates.rates[].name` | string | 3–100 characters | e.g. "IG Story Post" |
| `service_rates.rates[].description` | string | max 250 characters | Description of the service |
| `service_rates.rates[].amount` | number | positive integer (min 1) | Minor units: kobo for NGN, cents for USD... |
| `status` | string | enum: `draft` | `published` | Drafts can NEVER be retrieved via the public endpoint |
| `access_type` | string | enum: `public` | `private` | Defaults to public |
| `access_code` | string | exactly 6 alphanumeric characters | Required if `access_type` is private |
| `created` | number | — | Unix epoch milliseconds |
| `updated` | number | — | Unix epoch milliseconds |
| `deleted` | number/null | — | null unless the card has been deleted |

> **Important - `_id` vs `id`:** In MongoDB the document identifier lives in the `_id` field, per MongoDB convention. However, all front-facing API responses must expose it as `id`. Your serialization layer is responsible for this mapping - a response containing `_id` is incorrect.

---

## Endpoint 1: Create Creator Card

**Path:** `POST /creator-cards`

**Request Format:**

```json
{
  "title": "George Cooks",
  "description": "George Cooks is a weekly cooking podcast by Chef George AmadiObi",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [
    {"title": "YouTube Channel", "url": "https://youtube.com/@georgecooks"},
    {"title": "Instagram", "url": "https://instagram.com/georgecooks"}
  ],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      {"name": "IG Story Post", "description": "One Instagram story mention", "amount": 5000000},
      {"name": "Recipe Feature", "description": "Featured recipe segment on the podcast", "amount": 15000000}
    ]
  },
  "status": "published",
  "access_type": "public"
}

```

**Field Requirements:**

* `title` (Yes): String, 3-100 characters
* `description` (No): String, max 500 characters
* `slug` (No): 5-50 characters; letters, numbers, hyphens (-) and underscores (_) only; must be unique across all cards
* `creator_reference` (Yes): String of exactly 20 characters
* `links` (No): Array; each entry must have a title (1-100 chars) and a valid url (max 200 chars) starting with http:// or https://
* `service_rates` (No): If present: currency must be one of NGN, USD, GBP, GHS; rates must be a non-empty array; each rate must have a name (3-100 chars), a description (max 250 chars), and an amount that is a positive integer (minor units - no decimals, no negatives, no zero)
* `status` (Yes): Must be exactly `draft` or `published`
* `access_type` (No): Must be `public` or `private` if present; defaults to `public` when omitted
* `access_code` (Conditional): Required if `access_type` is `private`; must be exactly 6 alphanumeric characters (letters and numbers only). Must NOT be provided when `access_type` is `public` or omitted.

> **A note on validation:** The project template ships with a validator DSL (VSL) that handles field-level validation - types, required fields, lengths, and enums - and returns its own formatted error responses. Use it. Your job is to ensure all validation failures return HTTP 400, and to implement the business rules the validator cannot express (slug uniqueness, the conditional access_code rules, retrieval access control).

**Slug Auto-Generation:** If `slug` is omitted, your service must auto-generate one from the title:

1. Lowercase the title
2. Replace whitespace with hyphens
3. Remove any characters that are not letters, numbers, hyphens, or underscores
4. If the result is shorter than 5 characters OR already taken by another card, append a hyphen followed by a random 6-character alphanumeric suffix (e.g., `cook-a8x2k1`)

*If `slug` IS provided by the client and is already taken, return the `SL02` error - do NOT silently modify a client-provided slug.*

**Response Format (Success - HTTP 200):**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    ... // standard fields mapped appropriately
    "access_code": null,
    "created": 1767052800000,
    "updated": 1767052800000,
    "deleted": null
  }
}

```

*Note: `access_code` is returned in the creation response (the creator needs to know it), but it is NEVER returned by the public retrieval endpoint.*

---

## Endpoint 2: Public Card Retrieval

**Path:** `GET /creator-cards/:slug`
Retrieves a single Creator Card by its slug. This is the public endpoint that powers shareable card links.

**Access Rules (apply in this order):**

1. If no card with that slug exists → HTTP 404, error code `NF01`
2. If the card exists but its status is draft → HTTP 404, error code `NF02` (drafts are not publicly retrievable)
3. If the card is private and no `access_code` query parameter was supplied → HTTP 403, error code `AC03`
4. If the card is private and the supplied `access_code` does not match → HTTP 403, error code `AC04`
5. Otherwise → HTTP 200 with the card data

**Private card access:** clients supply the pin as a query parameter:
`GET /creator-cards/george-cooks?access_code=A1B2C3`

**Response Format (Success - HTTP 200):**
*Note: The `access_code` field is OMITTED entirely from retrieval responses, even for private cards accessed with the correct pin. The identifier is exposed as `id`, never `_id`.*

**Response Format (Error):**

```json
{
  "status": "error",
  "message": "Creator card not found",
  "code": "NF01"
}

```

---

## Endpoint 3: Delete Creator Card

**Path:** `DELETE /creator-cards/:slug`
Deletes the card tied to the given slug.

**Request Format:**

```json
{
  "creator_reference": "crt_8f2k1m9x4p7w3q5z"
}

```

**Field Requirements:**

* `creator_reference` (Yes): String of exactly 20 characters

**Behavior:**

* If no card with that slug exists → HTTP 404, error code `NF01`
* On success → HTTP 200, returning the deleted card in the same response format as the creation endpoint
* Once a card is deleted, it must no longer be retrievable via the public retrieval endpoint (`GET /creator-cards/:slug` returns HTTP 404, `NF01`)

---

## Custom Error Codes

Field-level validation errors (wrong types, missing required fields, length violations, invalid enum values) are handled by the template's validator and simply need to return HTTP 400. The codes below are the custom business rule errors you must implement yourself:

| Business Rule Error | Code | HTTP Code | Example Message |
| --- | --- | --- | --- |
| Slug must be unique across all cards | `SL02` | 400 | "Slug is already taken" |
| `access_code` is required when `access_type` is private | `AC01` | 400 | "access_code is required when access_type is private" |
| `access_code` must not be set on public cards | `AC05` | 400 | "access_code can only be set on private cards" |
| Card with the given slug not found | `NF01` | 404 | "Creator card not found" |
| Drafts are not publicly retrievable | `NF02` | 404 | "Drafts are not publicly retrievable" |
| `access_code` missing for private card fetch | `AC03` | 403 | "Access code required" |
| `access_code` mismatch for private card fetch | `AC04` | 403 | "Invalid access code" |

*(Note: Error codes NF01, NF02, AC03, and AC04 are inferred directly from Endpoint 2 specifications)*
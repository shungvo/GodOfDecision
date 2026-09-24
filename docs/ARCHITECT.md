# Architecture

## Stack

Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui + Base UI
- Framer Motion
- Zustand
- PWA

Backend

- Node.js
- Express 5 (ESM)
- Google Gemini (`@google/genai`)
- Ollama (local fallback provider)

---

## Repository Layout

god-of-decision/
Next.js frontend.

backend/
Express API. Owns all content and all AI calls.

docs/
Specification. Source of truth for product, design and content rules.

---

## Two Pillars

The app has two independent features.

Tarot
Reflective card reading. Deck of 78 cards.

Decision
Fast answers from the book of the god of decision. 400 answers.

They share the wizard, the design system and the history list.

They do not share data, routes or prompts.

---

## Frontend Structure

app/
Routes. App Router.

components/
UI and feature components.

hooks/
React hooks.

lib/
API client and utilities.

stores/
Zustand stores.

data/
Static client-side data only. Never card or answer content.

types/
Shared TypeScript types.

public/
Icons, card images, service worker.

---

## Routes

/
Home

/tarot
Tarot reading

/oracle
Decision draw

/history
Past readings, both pillars

/explore
Browse the tarot deck

/profile
Statistics and settings

/offline
PWA offline fallback

Each route is a folder containing `page.tsx`.

There is no `pages/` directory.

---

## Backend Structure

routes/
decision.routes.js
tarot.routes.js

controllers/
Request validation and response shape.

constants/
topics.js           Life aspects and the wording the AI gets

services/
answer.service.js   Decision.json access
card.service.js     Tarot.json access, draw with orientation
decision.service.js Decision pillar logic
tarot.service.js    Spreads, card resolution, prompt
gemini.service.js   AI provider
ollama.service.js   Local fallback provider

data/
Decision.json
Tarot.json

---

## Data

Both datasets live in the backend.

The frontend never reads them directly and never hardcodes their text.

Card images are the exception. They are static assets in
`god-of-decision/public/images/tarot/`, referenced by the `image` field.

### Tarot.json

78 cards. IDs 1 to 78.

22 major arcana, 56 minor arcana (4 suits of 14).

```json
{
  "tarot_cards": [
    {
      "id": 1,
      "slug": "the-fool",
      "arcana": "major",
      "suit": null,
      "number": 0,
      "name_vn": "Gã Khờ",
      "name_en": "The Fool",
      "image": "/images/tarot/the-fool.jpg",
      "keywords_vn": ["Khởi đầu mới", "Phiêu lưu", "Tự do"],
      "keywords_en": ["New beginnings", "Adventure", "Freedom"],
      "upright_vn": "...",
      "upright_en": "...",
      "reversed_vn": "...",
      "reversed_en": "..."
    }
  ]
}
```

`arcana` is `major` or `minor`.

`suit` is `null` for major arcana, otherwise `wands`, `cups`, `swords` or `pentacles`.

`number` is 0 to 21 for major arcana, 1 to 14 for minor (11 Page, 12 Knight, 13 Queen, 14 King).

### Decision.json

400 answers. IDs 1 to 400.

```json
{
  "book_answers": [
    { "id": 1, "answer_vn": "...", "answer_en": "..." }
  ]
}
```

---

## API — Tarot

### GET /api/tarot/cards

Query: `arcana`, `suit`. Both optional.

Response:

```json
{
  "success": true,
  "data": {
    "total": 78,
    "cards": [ /* raw Tarot.json entries */ ]
  }
}
```

### GET /api/tarot/cards/:slug

One card. 404 if the slug is unknown.

Tarot asks the user no question. The cards go on the table first,
then the user picks a life aspect. So drawing and reading are two
calls, not one.

### GET /api/tarot/topics

The life aspects a reading can be framed around.

```json
{
  "success": true,
  "data": {
    "topics": [{ "id": "love", "vi": "Tình yêu", "en": "Love" }]
  }
}
```

Ids: `general`, `love`, `relationships`, `career`, `money`,
`health`, `growth`, `study`.

Owned by `backend/constants/topics.js`, which also holds the
wording the AI is given for each one.

### POST /api/tarot/draw

Cards only. No question, no topic, no AI.

Request:

```json
{ "spread": "single | three" }
```

`spread` defaults to `single`.

Response:

```json
{
  "success": true,
  "data": {
    "spread": "three",
    "cards": [
      {
        "id": "T001",
        "slug": "the-fool",
        "position": "past",
        "orientation": "upright",
        "arcana": "major",
        "suit": null,
        "number": 0,
        "name": { "vi": "Gã Khờ", "en": "The Fool" },
        "image": "/images/tarot/the-fool.jpg",
        "keywords": { "vi": [], "en": [] },
        "meaning": { "vi": "...", "en": "..." }
      }
    ]
  }
}
```

`id` is `T` plus the zero-padded Tarot.json id.

`position` is `null` for a single draw, and `past` / `present` / `future` for a three spread.

`meaning` is already resolved by `orientation`. The client does not branch.

Cards in one draw are always distinct.

### POST /api/tarot/interpret

Read an already drawn spread for one life aspect.

Request:

```json
{
  "cards": [
    { "slug": "the-fool", "orientation": "upright", "position": "past" }
  ],
  "topic": "career",
  "lang": "vi | en"
}
```

At most 3 cards. `lang` defaults to `vi`.

Only slugs travel. The server looks every card up in Tarot.json,
so a client cannot feed the AI card meanings of its own invention.
An unknown slug is a 400.

Response:

```json
{
  "success": true,
  "data": {
    "topic": "career",
    "lang": "vi",
    "cards": [],
    "interpretation": "string or null",
    "interpretationError": "string or null"
  }
}
```

If the AI is unavailable, `interpretation` is `null` and `interpretationError`
carries the reason. The draw itself is still valid and the client should show
the cards and their meanings.

---

## API — Decision

### POST /api/decision/draw

Request:

```json
{ "question": "string, 1 to 500 characters" }
```

Response:

```json
{
  "success": true,
  "data": {
    "question": "string",
    "answer": {
      "id": "A001",
      "vi": "string",
      "en": "string",
      "type": "general",
      "tags": ["oracle"],
      "emoji": "✨"
    },
    "interpretation": "string"
  }
}
```

`answer.id` is `A` plus the zero-padded Decision.json id.

---

## Errors

```json
{ "success": false, "error": "string" }
```

400 for invalid input. 404 for unknown card. 500 otherwise.

---

## Flows

Tarot

Choose a spread, one card or three
↓
Backend draws distinct cards, each with a random orientation
↓
User turns the cards over one by one
↓
User picks a life aspect
↓
AI reads the cards together, for that aspect
↓
Frontend shows the reading

Decision

Question
↓
Backend picks one random entry from Decision.json
↓
AI interprets that entry in the context of the question
↓
Frontend reveals the answer

In both flows the drawn content is the source of truth.

The AI may only interpret it.

The AI must never replace or contradict it.

---

## Persistence

No database.

History lives in client storage.

Future:
Supabase or Firebase.

---

## Principles

- Server Components by default, `"use client"` only when needed
- Strict TypeScript
- Reusable components
- Mobile First
- Feature based organization
- Content lives in the backend, presentation lives in the frontend

# GOD — Guidance Of Destiny

A mobile-first PWA that helps people reflect on decisions through card draws and oracle guidance.

Not a fortune teller. A cute magical companion.

Motto:
"When logic is not enough."

---

## Repository

god-of-decision/
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Zustand, PWA.

backend/
Express 5 (ESM), Google Gemini, Ollama as local fallback.

docs/
Specification. Read before writing code.

---

## Specification

docs/PROJECT.md
Vision, principles, brand.

docs/ARCHITECT.md
Stack, structure, data, API contract.

docs/FEATURES.md
Screens and flows.

docs/DESIGN.md
Colors, radius, shadows, typography.

docs/UI_RULES.md
Layout and animation rules.

docs/TAROT_ENGINE.md
Deck, spreads and tone rules for the tarot pillar.

docs/DECISION_ENGINE.md
Book and tone rules for the decision pillar.

docs/AI_PROMPT.md
Coding rules.

---

## Two Pillars

Tarot
Reflective card reading. 78 cards, upright and reversed.
`backend/data/Tarot.json` → `/api/tarot/*`

Decision
Fast answer from the book of the god of decision. 400 answers.
`backend/data/Decision.json` → `/api/decision/*`

Separate data, separate routes, separate prompts.
Shared wizard, design system and history list.

---

## Data

Both datasets live in the backend. Both are bilingual, `vi` and `en`.

A draw is interpreted by the AI in the context of the user's question.
What was drawn is the source of truth. The AI never replaces or contradicts it.

The frontend never reads these files and never hardcodes their text.
It calls the API.

Card images are the one exception: static assets in
`god-of-decision/public/images/tarot/`.

---

## Visual Identity

Cute. Cozy. Magical. Soft. Playful. Calm.

Reference feeling: Duolingo, Finch, Pokémon Sleep, iOS 26.

Avoid: neon, cyberpunk, gaming UI, horror, gothic, dark occult.

Primary:
#34117E to #7B45F0

Magic Gold:
#FBBF24

Background:
#F8F5FF

Full palette in docs/DESIGN.md.

---

## Before Writing Code

Read `god-of-decision/node_modules/next/dist/docs/`.

This Next.js version has breaking changes. Do not rely on memory.

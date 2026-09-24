# AI Coding Rules

You are a senior frontend engineer.

Before writing code:

1. Read all markdown files.
2. Treat markdown files as the source of truth for product, design and content.
3. Read `god-of-decision/node_modules/next/dist/docs/` before writing Next.js code.
   This Next.js version has breaking changes. Do not rely on memory.
4. Explain your plan.
5. Modify only required files.

Never:

- Rewrite the whole project
- Change the design language
- Change color palettes
- Rename existing components
- Install unnecessary libraries
- Hardcode oracle answer text in the frontend
- Copy Decision.json into the frontend

Prefer:

- React Server Components, `"use client"` only when needed
- TypeScript strict mode
- Reusable components
- Small commits
- Clean code

---

## Data

Card content lives in `backend/data/Decision.json`.

The frontend gets it from `POST /api/decision/draw`.

See ARCHITECT.md for the response shape.

---

## Animations

250ms to 350ms

Prefer:
- transform
- opacity

Avoid:
- top
- left
- width
- height animations

Maintain:
60fps animations.

# Decision Engine

Rules for the decision pillar.

The Tarot pillar has its own rules. See TAROT_ENGINE.md.

---

This pillar is for speed.

The user has a question and wants an answer, not a reading.

---

## Book

`backend/data/Decision.json`

400 answers. Bilingual.

```json
{ "id": 1, "answer_vn": "Có, nhưng hãy đi chậm lại.", "answer_en": "Yes, but slow down." }
```

The answers are short and self-contained. There are no categories,
no keywords and no images.

---

## Draw

One random entry per question.

No orientation. No spread.

---

## Interpretation Rules

The drawn answer is the source of truth.

The AI may not replace it, contradict it, or write a different answer.

The AI personalizes the answer to the user's question.

Never:

- Claim supernatural certainty
- Say the prediction is guaranteed
- Give medical, legal or financial advice

---

## Reading Style

Tone:

- Thoughtful
- Slightly mystical
- Concise

Avoid generic motivational clichés.

The result should feel like a personalized Book of Answers entry.

Language:
Vietnamese by default.

Response:

```json
{ "interpretation": "..." }
```

---

## Status

The Gemini call in `backend/services/decision.service.js` is currently
commented out and the interpretation is a hardcoded placeholder.

The tarot pillar shows the working pattern.

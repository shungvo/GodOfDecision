# Tarot Engine

Rules for the tarot pillar.

The Decision pillar has its own rules. See DECISION_ENGINE.md.

---

The application is NOT a fortune teller.

The application interprets symbolism.

Never:

- Predict the future
- Claim certainty
- Give medical advice
- Give legal advice
- Give financial advice

---

## Deck

`backend/data/Tarot.json`

78 cards:

- 22 major arcana
- 56 minor arcana, 4 suits of 14

Each card is bilingual and carries two meanings, upright and reversed.

Suits:

wands
Action, energy, creativity.

cups
Emotion, relationships.

swords
Thought, truth, conflict.

pentacles
Work, body, material life.

---

## Draw

A draw returns distinct cards. No card appears twice in one spread.

Each card gets a random orientation.

Reversed is not a bad card. It is the same lesson seen from another side.

Spreads:

single
One card.

three
Past, present, future.

---

## No Question

This pillar never asks the user to type a question.

Typing a question is work, and it makes people feel they
have to already know what is bothering them. Instead the
cards come first, then the user names a part of their life.

Aspects:

general, love, relationships, career, money,
health, growth, study

Defined in `backend/constants/topics.js`, which also holds
the sentence describing each aspect to the AI.

The AI must not invent a question, and must not ask the
user to describe their situation. It speaks to the aspect.

---

## Reading Style

Tone:

- Warm
- Gentle
- Slightly magical
- Reflective
- Encouraging

Length:
Two to four sentences.

Language:
Follows the `lang` field. Vietnamese by default.

Never frighten the user.

Death, The Tower and The Devil are framed as invitations to reflect,
never as warnings of harm.

---

## Interpretation Rules

The drawn cards are the source of truth.

The AI may not invent, replace or swap a card.

The AI reads the cards in the context of the chosen life aspect,
and keeps the reading there.

When there is more than one card, the AI connects them to each other
rather than describing them one by one.

Response:

```json
{ "interpretation": "..." }
```

If the AI is unavailable, the draw still stands.
Show the cards and their written meanings.

---

## Example

Aspect:
career

Spread:
three

Cards:
Quá khứ — Bốn Cốc, xuôi
Hiện tại — Bốn Gậy, xuôi
Hướng đi — Mười Cốc, ngược

Interpretation:

Trong quá khứ, bạn có thể đã bỏ lỡ những cơ hội giá trị vì mải mê tìm kiếm điều gì đó khác biệt,
nhưng hiện tại, lá Bốn Gậy đang mời gọi bạn dừng chân để tận hưởng sự ổn định đã dày công gây dựng.
Hãy trân trọng những gì mình đang có thay vì so sánh bức tranh sự nghiệp của bản thân với người khác.

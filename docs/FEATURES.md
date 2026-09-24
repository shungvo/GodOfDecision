# MVP Features

## Two Pillars

Tarot
Reflective reading. 78 cards, upright and reversed.
Data: `backend/data/Tarot.json`

Decision
Fast answer from the book of the god of decision. 400 answers.
Data: `backend/data/Decision.json`

Both are served by the backend. The frontend never owns card or answer text.

---

## Home

- Floating wizard hero
- Daily card preview
- Quick actions into both pillars
- Bottom navigation

---

## Tarot

Route:
/tarot

The user is never asked to type a question. They choose a
spread, turn cards over, then say which part of their life
they want read.

Flow:

Pick a spread, two tabs at the top
↓
POST /api/tarot/draw
↓
Empty slots above, a fan of face down cards below
↓
Tap a card, it flies into the next slot and flips
↓
Once every slot is full, a sheet opens
↓
Pick a life aspect
↓
POST /api/tarot/interpret
↓
The reading replaces the grid in the same sheet

Spreads:

single
One card. No position.

three
Past, present, future.

Each drawn card carries an orientation, upright or reversed.
The meaning shown follows the orientation.

Life aspects:

Tổng quát, Tình yêu, Mối quan hệ, Sự nghiệp,
Tiền bạc, Sức khỏe, Bản thân, Học hành

The reading shows:

- AI interpretation of the whole spread, for the chosen aspect
- Each card: name, position, orientation, keywords, meaning

The user can go back and read the same cards for another
aspect without drawing again.

---

## Decision

Route:
/oracle

For when the user wants an answer, not a reading.

Flow:

Question
↓
Thinking animation
↓
POST /api/decision/draw
↓
Answer + interpretation

Short. One answer. No spread, no orientation.

---

## Daily Card

One tarot card per day.

Picked by date so it stays the same all day.

Display:

- Card image
- Name
- Short meaning

Expand for the longer interpretation.

---

## Explore

Route:
/explore

Browse the 78 card deck.

Filter by arcana and suit.

Uses `GET /api/tarot/cards`.

---

## Wheel Of Fate

User enters their own options.

Spin.

Display result.

Uses neither dataset. The user supplies the options.

---

## History

Client storage. Both pillars in one list.

Store:

- Date
- Pillar, tarot or decision
- Life aspect for tarot, question for decision
- Result, cards or answer
- Interpretation

Tapping an item opens the detail.

---

## Profile

Statistics:
- Total readings
- Streak
- Favorite cards

Settings:
- Theme
- Language
- Sound

---

## Future Features

- Journal
- Mood tracker
- Friendship reading
- Love reading
- Lucky numbers
- AI chat

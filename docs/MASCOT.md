# Mascot

## Who

A small chibi wizard who lives inside the user's phone.

Working name: **Lumi**. Short, soft, says the same thing in `vi` and `en`
(light, glow). Replace freely before launch.

Lumi is not a god, not a fortune teller, not a guru.
Lumi is a companion who sits with the user while they think.

One line:
"A sleepy little star-keeper who helps you hear what you already know."

---

## Personality

Friendly, gentle, curious, a little clumsy, quietly wise.

- Listens more than talks
- Never judges a question
- Gets excited about small wins
- Dozes off when nothing is happening
- Is proud of the cards, careful with them

Lumi never looks scary, smug, sad for long, or mysterious in a dark way.

---

## Current Assets

The approved design is `design/mascot/lumi-reference.webp`.
Match it when making anything new.

| File | Made from | Used in |
|---|---|---|
| `public/images/mascot/lumi-face.webp` | Head and hat cropped from the reference, 512px | Every circular avatar: header, profile, login, splash, onboarding, tarot sheet, share story |
| `public/images/mascot/lumi.glb` | Tripo image-to-3D, simplified and meshopt compressed, ~600KB | Home, floating beside the daily card |
| `public/icons/*.png` | Same face crop | PWA and home screen icons |

The raw Tripo export is `design/mascot/lumi-tripo-source.glb`, kept out of git.

Known gaps in the 3D model: the gold star on the hat tip is missing
and the cloud has grey smudges. Fix in Blender, then re-run:

```
npx @gltf-transform/cli optimize design/mascot/lumi-tripo-source.glb \
  god-of-decision/public/images/mascot/lumi.glb \
  --compress meshopt --simplify-ratio 0.025 --simplify-error 0.003 \
  --texture-compress webp --texture-size 1024
```

---

## Silhouette

Must read clearly as a black shape at 48px.

The shape is a teardrop: a tall soft hat, a round head, a small body
that tapers into the robe hem. No legs visible. Lumi floats.

Proportions, in heads:

- Total height without hat: 2 heads
- Hat: about 1 head tall, tip flops to one side
- Head: 1 head, nearly round, slightly wider than tall
- Body + robe: 1 head, bell shape, hem ends in a soft wave
- Hands: two small round mittens peeking out of the sleeves, no fingers

Lumi always hovers above a tiny glowing cloud or a few sparkles,
never touches the ground.

---

## Details

### Face

- Large eyes, set low and wide on the face
- Eyes are dark navy ovals (`#1E1B4B`) with two white highlights each
- Small blush ovals under the eyes, soft pink
- Tiny mouth, a short curve. No teeth, no nose
- Eyebrows only appear for expressions, otherwise hidden

### Hat

- Soft fabric wizard hat, not stiff
- Tip flops to the right and ends in a small gold star (`#FBBF24`)
- Wide brim that slightly shades the eyes
- A thin gold band with a crescent moon charm
- The star at the tip can glow; it is Lumi's "thinking light"

### Robe

- One-piece hooded robe, wide sleeves covering the hands
- Hem ends in a wavy, cloud-like edge
- A scatter of small star prints, few and large rather than many and tiny
- A round collar or small cape in a lighter tone

### Prop

A single tarot card, held in both hands or floating beside Lumi.
Card back uses the app's card back design (`public/images/card.webp`).

Optional second prop: a small glowing orb for the Decision pillar.

No wand. No staff. No book with occult symbols.

---

## Colors

Use the app palette. Nothing outside it except skin and blush.

| Part | Color |
|---|---|
| Hat, robe main | Primary 700 `#6631DB` |
| Robe shadow side | Primary 800 `#491AB1` |
| Collar, sleeve cuffs, inner hat | Secondary 100 `#D0BCFC` |
| Star prints, hat band | Secondary 300 `#A981FF` |
| Hat star, moon charm, sparkles | Magic Gold `#FBBF24` |
| Eyes | Text Primary `#1E1B4B` |
| Skin | Warm light `#FFE8DC` |
| Blush | Soft pink `#FFB4C6` |
| Floating cloud | White `#FFFFFF` to Background `#F8F5FF` |

Darkest value on the character is Primary 900 `#34117E`, only in
deep creases. Never pure black.

---

## Material And Light

Style: soft vinyl toy, claymorphism.

- Matte surfaces, very low specular
- Subsurface glow on skin and the hat star
- Rounded edges everywhere, no sharp corners
- Fabric has gentle folds, not detailed cloth simulation
- Key light from top left, warm white
- Rim light from behind in Secondary 200 `#B796FE`
- Soft ambient occlusion, no hard cast shadows
- Background for renders: transparent

It should feel like something you want to pick up and squeeze.

---

## Do And Don't

Do:

- Big head, small body
- Round, soft, squishy
- Purple and gold, light and airy
- Calm, slightly sleepy default face

Don't:

- Realistic anatomy, long limbs, visible legs
- Neon glow, glitter overload, lens flares
- Skulls, pentagrams, eyes on hands, crystal balls with smoke
- Angry or creepy expressions
- Gender coded features. Lumi is neither boy nor girl
- Copying any existing character's design

---

## Expressions

Each one maps to a moment in the app.

| Name | Pose | Face | Used in |
|---|---|---|---|
| `idle` | Floating, hands in sleeves | Calm, half smile, slow blink | Home hero |
| `wave` | One sleeve raised | Eyes closed happy `^ ^` | Splash, onboarding, login |
| `thinking` | Hand to chin, hat star glowing | Eyes looking up, small `o` mouth | Decision thinking, AI loading |
| `holding-card` | Card in both hands, held to chest | Soft smile | Tarot draw, daily card |
| `reveal` | Card held out toward the viewer | Eyes wide, sparkle highlights | Answer reveal, card flip |
| `cheer` | Both sleeves up, small jump | Big open smile | Streak, first reading |
| `sleepy` | Curled on cloud, hat over eyes | Closed eyes, `z` sparkles | Offline, empty history |
| `tired` | Slumped, star dim | Small apologetic smile | Daily token limit reached |
| `surprised` | Leaning back, hat tilted | Round eyes, small `o` | Errors, reversed card |
| `listen` | Leaning in, one hand at ear | Curious, eyebrows up | Question field focus |

`idle`, `thinking` and `holding-card` are required for launch.
The rest can follow.

---

## Voice And Lines

Every sentence Lumi says lives in `god-of-decision/lib/lumi-lines.ts`.
Never hardcode a Lumi line in a component.

| API | Use |
|---|---|
| `lumiLine(moment, { lang, seed })` | Pick a line. Pure, stable per moment + day + seed, safe on the server |
| `<LumiSays moment="..." />` | Speech bubble. `from="up-right"` under a sheet's header mascot, `from="avatar"` with its own face |
| `readingMoment(pillar, readStatus, readErrorStatus)` | Moment for any AI reading sheet |
| `greetingMoment(hour)` | Moment for a time-of-day hello |

Moments: `greet_*`, `daily_*`, `tarot_*`, `oracle_*`, `streak`,
`first_reading`, `share`, `history_*`, `error`, `need_login`,
`quota_low`, `offline`.

Writing rules: short (≤ 40 characters, 60 at most), `vi` and `en` for
every moment, 3+ variants, at most one emoji from ✨ 💫 🌙 ⭐ ☁️ 💜.
Lumi never promises an outcome and never contradicts what was drawn.

---

## Animation

Follow `docs/UI_RULES.md`: floating, slight rotation, blinking.

| Loop | Detail |
|---|---|
| Float | Up and down 6–8px, 3s, ease in out |
| Sway | Rotate ±3°, 4s, out of phase with float |
| Blink | Every 3–5s, randomised, 120ms |
| Hat tip | Follows float with a small delay, like soft fabric |
| Star glow | Pulses only in `thinking` |

Animate with `transform` and `opacity` only. Respect
`prefers-reduced-motion`: keep the pose, drop the float and sway.

---

## Deliverables

### Source

- Blender `.blend` with a simple rig: body, head, hat tip, both arms,
  eyelids, mouth shapes
- Turnaround: front, three quarter, side, back

### Static renders

- One per expression
- `.webp`, transparent background, 1024 × 1024, character centred,
  10% padding
- Keep a 2048 master `.png` outside the app

### Loops

- `idle`, `thinking`, `sleepy` as short seamless loops
- `.webm` with alpha (VP9) and an animated `.webp` fallback
  for Safari, 512 × 512, under 500 KB each

### Realtime (optional)

- One `.glb` for the Home hero only
- Under 15k triangles, textures 1024 max, under 1 MB total, Draco
  compressed
- Loaded lazily, with the `idle` render as placeholder

### File names

```
god-of-decision/public/images/mascot/
  lumi-idle.webp
  lumi-wave.webp
  lumi-thinking.webp
  lumi-thinking.webm
  lumi-holding-card.webp
  ...
  lumi.glb
```

### App icon

A separate, simplified version: head and hat only, on a Primary 600
`#7B45F0` circle. Must still read at 48px. Replaces the files in
`god-of-decision/public/icons/`.

---

## Prompts For Image Tools

For concept exploration only. The final model is built by hand from
this sheet.

Base:

```
cute chibi wizard mascot, 3D render, soft vinyl toy style,
claymorphism, big round head, tiny body, no legs, floating on a
small white cloud, soft floppy purple wizard hat with a golden star
on the drooping tip and a crescent moon charm, purple hooded robe
with wavy cloud-like hem and a few large lilac star prints, wide
sleeves hiding the hands, large dark navy eyes with white highlights,
pink blush, tiny smile, gender neutral, matte materials, soft studio
lighting, lavender rim light, pastel purple #6631DB and gold #FBBF24
palette, transparent background, centered, full body, front view
```

Add per expression:

```
idle:          calm half smile, hands tucked in sleeves
thinking:      hand on chin, looking up, hat star glowing softly
holding-card:  holding a tarot card with both hands against its chest
cheer:         both arms raised, joyful, small sparkles around
sleepy:        curled up asleep on the cloud, hat over its eyes
```

Negative:

```
realistic, scary, dark, gothic, neon, cyberpunk, skull, pentagram,
long legs, adult proportions, sharp edges, glossy plastic, text,
watermark
```

---

## Artist Checklist

- [ ] Reads as Lumi in silhouette at 48px
- [ ] Only palette colors, no pure black
- [ ] Head about half of the body height without hat
- [ ] No legs, always floating
- [ ] Hat tip star is gold and can glow
- [ ] Face has no nose, no teeth
- [ ] Looks calm in `idle`, not blank
- [ ] Works on `#F8F5FF` and on white cards
- [ ] Every loop is seamless
- [ ] File sizes within budget

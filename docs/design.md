# Design

## Tone

A pitch-ear-training service called **attune**. It should feel like working out a song at the kitchen table late at night — a contemporary musician charting a tune by ear with a chord chart open and a warm light overhead. Quiet, focused, rooted in notation. Editorial rather than playful. Single-purpose like a tuner or metronome, not a course or a game.

The product-level wireframe lives at [`./wireframe.md`](./wireframe.md). This doc covers *how it looks and feels*; that one covers *how it's laid out*.

## Metaphor

**Working out a song at the kitchen table.** A contemporary musician sitting up late, charting a tune by ear — chord chart, headphones, warm overhead lamp. Pitch training is meditative, you listen *into* a sound for relationships, and the visual language should reflect that: dim ambient room, a single warm light, paper-textured surfaces, real musical notation as ornament. No stage, no spotlight, no theatrics.

This is deliberately distinct from `rushing-dragging`'s "dim studio with a brass stage light." Same family of warm-accent-on-dark restraint, different room.

## Palette

Dark only for v1. Light mode is deferred.

| Token | Hex | Use |
|---|---|---|
| `--ink-950` | `#08070d` | Page background base |
| `--ink-900` | `#0e0d18` | Default surface — cool blue-violet, not pure black |
| `--ink-850` | `#1a1828` | Card surface (~1.5:1 against ink-900, visibly distinct) |
| `--ink-800` | `#25223a` | Raised surface, hover |
| `--ink-700` | `#3a3552` | Borders, dividers (readable hairline at 1px) |
| `--lamp-300` | `#f3d59c` | Highlight on accent (focused button text) |
| `--lamp-400` | `#e8b86a` | Primary accent — amber lamplight |
| `--lamp-500` | `#cc9846` | Pressed / active accent |
| `--lamp-600` | `#996f2f` | Muted accent (disabled) |
| `--leaf-400` | `#8fbf9c` | Correct-answer feedback only — never decorative |
| `--paper` | `#ece6d7` | Primary text (warm off-white) — ~17:1 on ink-900 |
| `--paper-muted` | `#b0a999` | Secondary text — ~9:1 on ink-900 |
| `--paper-faint` | `#807a6c` | Tertiary text, hairlines — ~5:1 on ink-900 (AA pass) |

**Rules**
- One accent (`lamp`). No secondary brand color.
- `leaf` is reserved for "correct" — never used decoratively.
- No radial glow, no gradient backgrounds. The room is flat-lit. (Departure from rushing-dragging.)
- Borders are `--ink-700` at 1px. Use sparingly.

## Type

| Use | Family | Weight | Notes |
|---|---|---|---|
| Display | **Fraunces** | 500–700, italic for accents | Optical sizing on. Never above 700 — leave the billboard weights to rushing-dragging. |
| UI / body | **Inter** | 400–600 | |
| Note names, chord labels, intervals | **Fraunces small caps** *or* Inter at tracked uppercase | 500 | Treat as score labels, not as UI chips. |
| Tabular numbers (stats) | Inter `font-feature-settings: "tnum"` | 500 | |

**Type scale** (rem)
```
display-l   2.5     (home masthead, screen titles)
display-m   1.75    (mode names)
body        1.0
small       0.875
caption     0.75    (uppercase tracked, footer stats)
```

Italic is reserved for **musical expression** — secondary descriptors on cards, the inflection word in a heading, mode subtitles. Never italicize for emphasis the way you would in English prose.

**Notation glyphs are first-class characters.** Always use real Unicode:
- `♯` U+266F sharp, `♭` U+266D flat, `♮` U+266E natural
- `♩` quarter, `♪` eighth, `♫` beamed eighths
- Render `C♯` not `C#`. The visual difference is the entire point of the design.

## Layout

**Generous whitespace, score-page proportions.** Content column maxes out around 720px on the exercise screens, 960px on home. Vertical rhythm in 8px increments.

**Staff-line ornament.** Section dividers and the answer area background can use a five-line staff motif at very low opacity (`--paper-faint` at 12%). It should read as paper-grain, not as functional notation. Never put real notes on it — that's a different product.

```
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    (1px, paper-faint @ 12%)
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
```

**Bar-line dividers.** Between sections, prefer a single tall hairline `│` 24px tall in `--paper-faint` to a horizontal rule. Subtle musical reference, no kitsch.

**Cards** are laid out like entries in a recital program: small ordinal number, title in display weight, italic subtitle, faint stat line. The same card primitive is used on both picker screens (home for instruments, instrument page for modes); only the title / subtitle / stat-line content differs. Disabled "(coming soon)" cards on the mode picker drop the stat line, fade the title, and remove the hover state — see `wireframe.md`.

```
i.   piano                        (home — instrument picker)
     keyboard exercises

ii.  single chord                 (instrument page — mode picker)
     name the chord
     level 2 · session · best 78%
```

## Voice

**Headlines stay plain English.** "name the note." "name the chord." "name the changes." Lowercase, period-terminated, calm.

**Contemporary studio vocabulary as labels** — borrowing from how musicians actually talk in 2026 (DAWs, jam sessions, charting a song):

| Concept | Label | Coded as |
|---|---|---|
| A single question / round | **take** ("take 3 of 10") | studio |
| Replay button | `↻ loop` | DAW |
| Next button | `next take →` | studio |
| Progression mode subtitle | `name the changes` | jazz, mainstream |
| Difficulty levels (1–5) | `warmup · session · gig · studio · mastering` | producer workflow |

Used consistently across the app. The level names appear as the small subtitle under a numeric level indicator — `level 3 · gig` — never as the primary control.

**Avoid:** `drop`, `bars`, `vibe`, `hot take`, `vibes-only`, anything dated-in-2-years.

**Feedback voice** stays neutral and short:
- Correct: `✓ mi · 3rd`
- Wrong: `✗ it was mi · 3rd` + `▶ play correct`

No exclamation marks anywhere. No "Great job!" No streak fireworks.

## Motion

| Use | Easing | Duration |
|---|---|---|
| Page enter | `cubic-bezier(0.4, 0, 0.2, 1)` | 400ms |
| Note/chord enters answer area | same | 300ms with `+4px → 0px` settle |
| Button press | `cubic-bezier(0.4, 0, 0.2, 1)` | 120ms |
| Feedback line | fade only | 200ms |

**No spring, no bounce.** Pitches *settle* into place — they don't pop. This is the most important motion rule.

Animations respect `prefers-reduced-motion`: durations collapse to 0, opacity transitions remain.

## Component patterns

**Primary button** (play / submit)
- Filled `--lamp-400` background, `--ink-950` text, weight 600
- 48px tall on desktop, 56px on mobile (thumb target)
- Hover: `--lamp-300`. Pressed: `--lamp-500`. Focus ring: 2px `--lamp-300` at 2px offset.

**Secondary button** (replay, back)
- Transparent background, `--paper-muted` text, `--ink-700` border
- Same dimensions as primary.

**Answer chips**
- Transparent background, `--ink-700` border, `--paper` text in Fraunces small caps
- Min-width 56px, height 44px, 12px horizontal padding
- Hover: border becomes `--lamp-400`. Selected (in progression mode): filled `--lamp-400`/`--ink-950`.
- Wrong answer flash: border `--paper-muted` for 600ms, then return to default. Don't use red.

**Mode card** (home + instrument page)
- Surface `--ink-850`, border `--ink-700`, 16px radius
- Hover: surface `--ink-800`, border `--lamp-400` at 30% opacity
- 24px padding, generous
- **Disabled variant** (used for unimplemented matrix cells on the mode picker): title and subtitle in `--paper-faint`, no hover state, cursor `default`. Stat line replaced by `coming soon` in `--paper-faint`. The card is still rendered at full size — the matrix shape is the point.

**Feedback line**
- Single line, `body` size, no icon background
- Correct: `--leaf-400` for the checkmark, `--paper` for the text
- Wrong: `--paper-muted` for the X, `--paper` for the text

## Accessibility

- All text ≥ 4.5:1 against its background. `--paper-muted` on `--ink-900` is the lower bound — verify, don't assume.
- Focus rings on every interactive element. Never `outline: none` without a replacement.
- Keyboard: every action reachable; shortcuts (`space`, `1–9`, `enter`) documented in a small footer hint that fades after first use.
- `prefers-reduced-motion` respected.
- ARIA: announce feedback line as a polite live region so screen readers hear correct/wrong without taking focus.
- Color is never the only signal — feedback always has both a glyph (✓/✗) and color.

## What we are not doing

- **No spotlight, no radial glow.** That's rushing-dragging's room.
- **No billboard hero.** A picker page does not earn 12vw type.
- **No notation kitsch.** Real glyphs in real contexts; never as wallpaper, never as decorative loops, never animated.
- **No fireworks, badges, XP, mascots.** Stats appear quietly in the footer; that is the entire gamification budget. (Levels exist as a complexity control, not as gamification — they're not celebrated.)
- **No classical-music affectation.** The level *names* (warmup, session, gig, studio, mastering) lean contemporary. No `allegro`, no `dolce`, no `pianissimo`.
- **No light mode** in v1.
- **No second accent color.** Lamp is alone.

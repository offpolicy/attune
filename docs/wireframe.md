# Wireframe

A single-page app called **attune**, served from GitHub Pages. Three exercise modes share a common shell; the home screen picks between them.

## Routes

Hash-based, so no server config is needed.

| Route | Screen |
|---|---|
| `/` | Home |
| `#/piano-note` | Piano single-note quiz |
| `#/guitar-chord` | Guitar chord quiz |
| `#/guitar-prog` | Guitar progression quiz |
| `#/settings` | Settings (drawer on desktop, full screen on mobile) |

## Shared shell

Every screen has the same outer frame:

```
┌──────────────────────────────────┐
│  [←]  attune                 [⚙] │   header
├──────────────────────────────────┤
│                                  │
│              content             │
│                                  │
├──────────────────────────────────┤
│  streak · today's accuracy       │   footer (exercise screens only)
└──────────────────────────────────┘
```

- Back arrow appears on every screen except home.
- Gear opens settings.
- Footer is hidden on home.

## Vocabulary

A few labels borrow contemporary studio language. Used consistently across all three modes:

| Concept | Label |
|---|---|
| A single question / round | **take** ("take 3 of 10") |
| Replay | `↻ loop` |
| Next question | `next take →` |
| Difficulty levels (1–5) | named `warmup · session · gig · studio · mastering` |

## 1. Home

Picks a mode. No audio plays here.

```
┌──────────────────────────────────┐
│  attune                      [⚙] │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────────┐  │
│  │ piano · single note        │  │
│  │ name the note              │  │
│  │ level 2 · best 92% · 🔥 4  │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ guitar · chord             │  │
│  │ name the chord             │  │
│  │ level 1 · best 78%         │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ guitar · progression       │  │
│  │ name the changes           │  │
│  │ level 1 · best 41%         │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

- Each card shows mode name, plain-English subtitle, current level, best accuracy, and current streak from localStorage.
- Tapping a card routes to that mode and starts the first take immediately (no second "start" tap).

## 2. Exercise screens — common pattern

All three exercises share this layout. Only the answer area changes.

```
┌──────────────────────────────────┐
│  [←]  piano · single note    [⚙] │
├──────────────────────────────────┤
│                                  │
│        ▶  play                   │   primary action
│        ↻  loop                   │   secondary, only after first play
│                                  │
│        ─── answer area ───       │   varies per mode (see below)
│                                  │
│        ✓ mi · 3rd                │   feedback line; empty before answer
│                                  │
│        next take →               │   appears after answering
│                                  │
├──────────────────────────────────┤
│  take 7 · streak 4 · 24/30 · 80% │
└──────────────────────────────────┘
```

### States

| State | What's visible |
|---|---|
| Idle (new take loaded) | `play` button only |
| Played | `play` (greyed) + `↻ loop` + answer area enabled |
| Answered correct | feedback `✓ <answer>` + `next take →` |
| Answered wrong | feedback `✗ it was <answer>` + `▶ play correct` + `next take →` |

### Keyboard shortcuts (desktop)

- `space` — play / replay target
- `d` — play `do` (tonic reference)
- `1`–`N` — pick the Nth enabled note in pitch order (left-to-right on the keyboard)
- `enter` — next take

## 3. Piano · single note — playback + answer area

Two playback buttons:
- **▶ play** — plays only the **target** note.
- **▶ do** — plays the **tonic** (reference). Always available, on demand.
- **↻ loop** — re-plays the target after the first `play`.

There is no auto-played reference; the user reaches for `▶ do` whenever they want a key anchor. This is the entire reference-policy model — manual, not configurable.

Answer area is a one-octave **piano keyboard**, not a chip grid:

```
   ┌──┐ ┌──┐    ┌──┐ ┌──┐ ┌──┐
   │  │ │  │    │  │ │  │ │  │
┌──┴┐ └─┴┐ ├────┴┐ └─┴┐ └─┴┐ ├────┐
│do │   │mi│  fa │   │   │   │ti │
└────┴────┴────┴────┴────┴────┴────┘
   C    D    E    F    G    A    B
```

- White keys = diatonic degrees (do/re/mi/fa/sol/la/ti).
- Black keys = chromatic accidentals; only enabled at higher levels.
- Keys outside the active pool are visibly muted and unclickable.
- Selected key fills with `--lamp-400`.
- Pool, range, and label scheme (solfege vs 1–7) all driven by the current level.

## 4. Guitar · chord — answer area

```
        ─── answer area ───

       [ A ] [ Am ] [ C ]  [ D ]
       [ Dm ] [ E ] [ Em ] [ F ]
                [ G ]
```

- One strummed chord plays.
- Answer chips show only chords currently in the active pool, which is determined by the current level.

## 5. Guitar · progression — answer area

The progression mode subtitle is **"name the changes."**

```
        ─── answer area ───

   key of E  ·  3 chords

   slot 1: [ E ]   <- selected
   slot 2: [   ]
   slot 3: [   ]

   [ E ] [ A ] [ B ] [ C#m ] [ G#m ] [ F#m ]

   [ submit ]
```

- A 3-chord progression in a fixed key plays end-to-end (length controlled by level).
- User fills slots in order; tapping a chord chip drops it in the next empty slot. Tapping a filled slot clears it.
- `submit` enabled only when all slots are full.
- After submit: each slot shows ✓ or ✗ in place; feedback line shows the correct progression. Optional roman-numeral view toggle.

## 6. Settings

Drawer from the right on desktop, full screen on mobile. Most users only touch **level**; advanced knobs are tucked behind a disclosure.

```
┌──────────────────────────────────┐
│  settings                    [×] │
├──────────────────────────────────┤
│                                  │
│  piano · single note             │
│   level   ●─○─○─○─○              │
│           warmup                 │
│   ▾ fine-tune                    │
│      pool          [ tonic triad ▾ ]      │
│      reference     ( every | first | none )│
│      range         [ C4 – C5  ▾ ]          │
│      labels        ( solfege | 1-7 )       │
│                                  │
│  guitar · chord                  │
│   level   ○─●─○─○─○              │
│           session                │
│   ▾ fine-tune                    │
│      pool          [ ☑ A ] [ ☑ Am ] …       │
│      voicing       ( fixed | varied )       │
│                                  │
│  guitar · progression            │
│   level   ●─○─○─○─○              │
│           warmup                 │
│   ▾ fine-tune                    │
│      key           [ E major  ▾ ]           │
│      length        ( 3 | 4 )                │
│      pool          [ ☑ I ] [ ☑ IV ] [ ☑ V ] │
│      tempo         ( slow | medium | fast ) │
│      show roman    ( on | off )             │
│                                  │
│  data                            │
│   [ reset progress ]             │
│                                  │
└──────────────────────────────────┘
```

- Changing **level** updates all the fine-tune knobs to the level's preset.
- Changing a fine-tune knob individually puts that mode into a `custom` level state (level slider shows `· custom`).
- All settings persist in localStorage. Defaults give a usable v1 with no configuration (everyone starts at level 1 / `warmup`).

### Level → knob presets (piano · single note)

| Level | Pool | Range |
|---|---|---|
| 1 warmup | tonic triad (do/mi/sol) | C4–C5 |
| 2 session | full diatonic (do/re/mi/fa/sol/la/ti) | C4–C5 |
| 3 gig | full diatonic | C4–C5 |
| 4 studio | + accidentals | C3–C5 |
| 5 mastering | full chromatic | C3–C5 |

The reference tonic is no longer level-bound — it is always available via the `▶ do` button. Levels 3–5 are still distinct from 1–2 because they expand the pool / range; the in-progress goal in the gig→mastering progression is to lean less on the `do` button by ear, not to have it taken away.

The other two modes have analogous level tables (defined in `design.md` / future settings spec).

## Navigation flow

```
       home
      ╱  │  ╲
     ╱   │   ╲
  piano chord  prog
     ╲   │   ╱
      ╲  │  ╱
       (← back to home)

   any screen → settings → back to where you were
```

## Mobile

- Same layout, same components, no separate mobile design.
- Cards on home stack full-width.
- Answer chips wrap to as many rows as needed; tap targets ≥ 44px.
- Settings opens as a full screen instead of a drawer.

## Out of scope for v1

- Accounts, sync, leaderboards.
- Custom exercise builder.
- Melodic dictation, interval mode, scale identification.
- Multiple instruments per mode.

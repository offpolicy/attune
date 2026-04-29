# Wireframe

A single-page app called **attune**, served from GitHub Pages. Exercises are organized as an **instrument × activity matrix** — the home screen picks an instrument, the next screen picks a mode (single note / single chord / chord progression). Everything past that is the same exercise shell.

## Routes

Hash-based, so no server config is needed.

| Route | Screen |
|---|---|
| `/` | Home — instrument picker |
| `#/piano` | Piano — mode picker |
| `#/guitar` | Guitar — mode picker |
| `#/piano/note` | Piano · single note quiz |
| `#/piano/chord` | Piano · single chord quiz |
| `#/piano/prog` | Piano · chord progression quiz |
| `#/guitar/note` | Guitar · single note quiz |
| `#/guitar/chord` | Guitar · single chord quiz |
| `#/guitar/prog` | Guitar · chord progression quiz |
| `#/settings` | Settings (drawer on desktop, full screen on mobile) |

The `{instrument}/{activity}` URL shape mirrors the picker tree. Activity slugs (`note`, `chord`, `prog`) match the exercise IDs so legacy deep links like `#/piano-note` redirect to `#/piano/note` with a one-line shim. All 6 matrix cells ship.

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

- Back arrow appears on every screen except home. On the mode picker it returns to home; on an exercise it returns to the mode picker for that instrument.
- Gear opens settings.
- Footer is hidden on home and on the mode picker.

## Vocabulary

A few labels borrow contemporary studio language. Used consistently across all modes:

| Concept | Label |
|---|---|
| A single question / round | **take** ("take 3 of 10") |
| Replay | `↻ loop` |
| Next question | `next take →` |
| Difficulty levels (1–5) | named `warmup · session · gig · studio · mastering` |
| The three activities | **single note · single chord · chord progression** |

## 1. Home — instrument picker

Picks an instrument. No audio plays here. Two cards, stacked.

```
┌──────────────────────────────────┐
│  attune                      [⚙] │
├──────────────────────────────────┤
│                                  │
│  pick your instrument            │
│                                  │
│  ┌────────────────────────────┐  │
│  │ i.  piano                  │  │
│  │     keyboard exercises     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ii. guitar                 │  │
│  │     fretboard exercises    │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

- Each instrument card shows ordinal, name, and a one-line italic descriptor.
- Tapping a card routes to that instrument's mode picker (`#/piano` or `#/guitar`).
- No per-instrument stats here on purpose — stats are per-mode and live one level deeper, where they're actionable.
- New instruments (bass, voice, etc.) are an additive change in v2 — append a third card, no other surface changes.

## 2. Instrument page — mode picker

Picks a mode for the selected instrument. Three cards: **single note · single chord · chord progression**. No audio plays here either.

```
┌──────────────────────────────────┐
│  [←]  guitar                 [⚙] │
├──────────────────────────────────┤
│                                  │
│  pick a mode                     │
│                                  │
│  ┌────────────────────────────┐  │
│  │ i.  single note            │  │
│  │     name the note          │  │
│  │     level 2 · session      │  │
│  │     best 92% · streak 4    │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ii. single chord           │  │
│  │     name the chord         │  │
│  │     level 2 · session      │  │
│  │     best 78%               │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ iii. chord progression     │  │
│  │      name the changes      │  │
│  │      level 1 · warmup      │  │
│  │      best 41%              │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

- Activity labels read in plain English: **single note · single chord · chord progression**. The italic subtitle is the existing per-mode prompt (`name the note`, `name the chord`, `name the changes`).
- Each card shows level, level name, and best accuracy / streak from localStorage.
- Tapping a card routes to that exercise (`#/{instrument}/{activity}`) and starts the first take immediately — no second "start" tap.
- The `ModeCard` primitive still supports a disabled "(coming soon)" variant — used when adding new instruments or activities mid-development.

### The matrix at v1

|              | single note | single chord | chord progression |
|---           |---          |---           |---                |
| **piano**    | ✓           | ✓            | ✓                 |
| **guitar**   | ✓           | ✓            | ✓                 |

All six matrix cells ship in v1. Single chord and progression modes share the same chord library and generators between piano and guitar — only audio rendering differs (block chord on piano vs strummed on guitar, root-octave synthesized voicing on piano vs curated open-position voicing on guitar). Adding instruments (e.g. bass) extends the matrix vertically without touching the picker tree.

## 3. Exercise screens — common pattern

All exercise modes share this layout. Only the answer area changes.

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

- The header crumb format is `{instrument} · {activity}` (e.g. `piano · single note`, `guitar · chord progression`). The back arrow returns to that instrument's mode picker.

### States

| State | What's visible |
|---|---|
| Idle (new take loaded) | `play` button only |
| Played | `play` (greyed) + `↻ loop` + answer area enabled |
| Answered correct | feedback `✓ <answer>` + `next take →` |
| Answered wrong | feedback `✗ it was <answer>` + `▶ play correct` + `next take →` |

### Keyboard shortcuts (desktop)

- `space` — play / replay target
- `d` — play `do` (tonic reference) *(piano · single note)*
- `1`–`N` — pick the Nth enabled note in pitch order (left-to-right on the keyboard)
- `enter` — next take
- `esc` — back to mode picker

## 4. Piano · single note — playback + answer area

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

## 5. Guitar · single chord — answer area

```
        ─── answer area ───

       [ A ] [ Am ] [ C ]  [ D ]
       [ Dm ] [ E ] [ Em ] [ F ]
                [ G ]
```

- One strummed chord plays.
- Answer chips show only chords currently in the active pool, which is determined by the current level. At higher levels the chip count grows substantially (4 → 22 across L1–L5); see [`./progression-algorithm.md`](./progression-algorithm.md) for the level preset table this mode shares with the progression mode's chord vocabulary.

## 6. Guitar · chord progression — answer area

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
- Generation logic (template-based v1): see [`./progression-algorithm.md`](./progression-algorithm.md).

## 7. Cross-instrument modes

The single-chord and progression modes are now multi-instrument; the same generator and answer UI serve both piano and guitar variants. Audio rendering branches on `instrument`:

- **single chord** — guitar plays a strum (22ms inter-string stagger); piano plays a block chord (no stagger).
- **chord progression** — same idea per slot. Piano gets a block-chord per progression step; guitar strums.
- **voicing source** — guitar uses curated open-position voicings (anchored low on the fretboard) when available, falling back to the synthesized voicing. Piano always uses the synthesized voicing (mid-octave, no curated overrides for now).
- **single note** — same pool/range/labels for piano and guitar; the only difference is which soundfont plays the target / tonic.

Specialization (e.g. piano-friendly chord curated voicings, a fretboard-style answer area for guitar single note) is a follow-up; the shared-infrastructure baseline ships first so the matrix can be ear-tested end-to-end.

## 8. Settings

Drawer from the right on desktop, full screen on mobile. Most users only touch **level**; advanced knobs are tucked behind a disclosure.

Settings is organized **per mode** — one section per matrix cell, six sections total in v1. Mode-pairs that share a knob shape (e.g. `piano-note` + `guitar-note` both use `PianoNoteKnobs`) are rendered by the same parametrized section component; only the `settingsKey` differs. Future restructure to group by instrument is a v2 follow-up if the section list gets unwieldy.

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
│      range         [ C4 – C5  ▾ ]          │
│      labels        ( solfege | 1-7 )       │
│                                  │
│  piano · single chord            │
│   level   ●─○─○─○─○              │
│           warmup                 │
│   ▾ fine-tune                    │
│      pool          [ ☑ C ] [ ☑ Am ] …      │
│      voicing       ( fixed | varied )       │
│                                  │
│  piano · chord progression       │
│   level   ●─○─○─○─○              │
│           warmup                 │
│   ▾ fine-tune                    │
│      length        ( 3 | 4 )                │
│      tempo         ( slow | medium | fast ) │
│      colour        [ triads ▾ ]             │
│      pool          [ ☑ I ] [ ☑ IV ] [ ☑ V ] │
│                                  │
│  guitar · single note            │
│   …same shape as piano · note   │
│                                  │
│  guitar · single chord           │
│   …same shape as piano · chord  │
│                                  │
│  guitar · chord progression      │
│   …same shape as piano · prog   │
│                                  │
│  data                            │
│   [ reset progress ]             │
│                                  │
└──────────────────────────────────┘
```

- Section headings are the full mode name (`{instrument} · {activity}`), matching the exercise crumb.
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

The other implemented modes have analogous tables — single chord by chord-name pool (4 → 22 chords across L1–L5), progression by `qualityScheme` axis (triads → triads+V7 → diatonic-7ths → extensions → altered). See [`../src/exercises/levels.ts`](../src/exercises/levels.ts) for the full presets and [`./progression-algorithm.md`](./progression-algorithm.md) for the colour-scheme rationale.

## Navigation flow

```
                        home
                       ╱     ╲
                      ╱       ╲
                  piano       guitar
                 ╱  │  ╲      ╱  │  ╲
               note ch prog note ch prog
               (✓) (✓)(✓)  (✓) (✓)(✓)

   any screen → settings → back to where you were
   exercise   →    [←]   → mode picker for that instrument
   mode picker →   [←]   → home
```

A two-step picker keeps each screen single-purpose: home decides "which world am I in?", the instrument page decides "which exercise inside that world?". The same Mode card primitive renders both pickers, so the cost of the extra step is one additional view, not a new design system.

## Mobile

- Same layout, same components, no separate mobile design.
- Cards on home and on the instrument page stack full-width. With only 2 (home) and 3 (instrument page) cards each, no scrolling on a typical phone.
- Answer chips wrap to as many rows as needed; tap targets ≥ 44px.
- Settings opens as a full screen instead of a drawer.

## Out of scope for v1

- Accounts, sync, leaderboards.
- Custom exercise builder.
- Melodic dictation, interval mode, scale identification.
- Specialization of the cross-instrument modes — piano-friendly curated chord voicings, a fretboard-style answer area for guitar single note, distinct level tables tuned per instrument. The shared-infrastructure baseline ships first; specialization is a v2 follow-up driven by ear-testing.
- Per-instrument settings reorganization. Six per-mode settings sections is fine for v1; regrouping by instrument waits until the section list grows or feedback says it should.

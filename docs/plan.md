# Implementation Plan

A concrete, milestone-driven plan to build **attune** from empty directory to deployed GitHub Pages site.

References:
- [`./wireframe.md`](./wireframe.md) — screen layouts and interactions
- [`./design.md`](./design.md) — visual language
- [`./progression-algorithm.md`](./progression-algorithm.md) — how `guitar-prog` builds questions (template-based v1, weighted-transition v2)

## Goals

1. Eight exercise modes in a **ragged instrument × activity matrix** ship in v1: piano and guitar each cover (single note, single chord, chord progression); bass covers (single note, bassline). Mode pairs that share knob shapes (e.g. `piano-note` + `guitar-note` + `bass-note`) reuse the same generator and answer UI; only audio rendering differs per instrument.
2. Two-step picker: home selects an **instrument**, the instrument page selects a **mode** (single note / single chord / chord progression). See [`./wireframe.md`](./wireframe.md).
3. Deployed as a static site at GitHub Pages.
4. No backend, no accounts, all state in `localStorage`.
5. Mobile-friendly, keyboard-accessible.
6. Audio that sounds like real instruments — sine waves are insufficient for chord recognition.

## Non-goals (v1)

- Accounts, sync, social, leaderboards.
- Adaptive difficulty driven by ML. (Manual level selection 1–5 is the entire difficulty system in v1.)
- Light mode.
- Custom user-defined exercises.
- Melodic dictation, interval-only mode, scale identification.
- Multi-language UI.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fastest dev loop for a static SPA; outputs deployable static assets. |
| Language | **TypeScript** | Catches scale-degree / interval math errors before runtime. |
| UI framework | **React 18** | Three modes share a shell; component model fits. Could be Preact later if bundle size matters. |
| Styling | **Tailwind v4** with `@theme` design tokens | Matches `design.md` palette tokens cleanly. CSS variables stay first-class. |
| Audio | **smplr** (`Soundfont` class) | Maintained successor to the archived `soundfont-player`. Loads General MIDI soundfonts on demand, handles scheduling internally via `start({ time, duration })`. MIT-licensed. Acceptable timbre for both piano and acoustic guitar verified at M1. |
| Routing | **`react-router` `HashRouter`** | Hash routes work on GitHub Pages with no rewrite rules. |
| State | `useReducer` + `localStorage` adapter | Three small state machines (active question, settings, stats); Redux/Zustand is overkill. |
| Testing | **Vitest** for exercise math; manual + Playwright smoke for audio | Audio is hard to unit-test; cover what matters and ear-test the rest. |
| Deploy | GitHub Actions → `gh-pages` via `actions/deploy-pages` | Standard, no third-party CI. |

### The audio decision in detail

**Choice: `smplr`'s `Soundfont` class** loading General MIDI instruments from Benjamin Gleitzman's hosted soundfont collection.

- Piano: `acoustic_grand_piano`.
- Guitar: `acoustic_guitar_steel`.
- Strummed chords are constructed in code: schedule note-ons across the strings of an open voicing with ~22ms stagger via `start({ note, time })`. Up-strum vs. down-strum is just stagger direction.

**Why `smplr` over `soundfont-player`:** the original `soundfont-player` was archived May 2023; `smplr` is the same author's maintained successor with a cleaner `start({ note, time, velocity, duration })` API. Drop-in replacement for our needs.

**Why not pre-rendered MP3s per chord:** generalizing to the progression mode would require another N×N×K explosion of clips. SoundFont generalizes for free — any chord, any key, any voicing.

**Why not pure synthesis:** chord *quality* recognition leans on partials and timbre. Synth chords sound like synth chords, not like guitars. Users would learn to identify "the synth's Am" not "an Am."

**Verified at M1 (2026-04-29):** `tmp/audio-probe.html` ships a standalone listening test using smplr from CDN. Piano and acoustic-steel guitar both came back acceptable; quality is fine for ear training.

## Architecture

### Module map

```
src/
├── main.tsx                # entry, mounts <App/>
├── App.tsx                 # router + global providers (audio, settings)
├── index.css               # tailwind + design tokens (mirrors design.md palette)
│
├── audio/
│   ├── instrument.ts       # loadInstrument('piano' | 'guitar') -> Player
│   ├── theory.ts           # note ↔ midi, scale degrees, chord voicings
│   ├── strummer.ts         # strum a list of notes with stagger
│   └── envelope.ts         # attack/decay shaping helpers
│
├── exercises/
│   ├── pianoNote.ts        # generate question, validate answer, advance
│   ├── guitarChord.ts
│   ├── guitarProgression.ts
│   └── levels.ts           # level (1-5) → knob preset tables, per mode
│
├── state/
│   ├── settings.ts         # SettingsState, default + reducer + persistence
│   ├── stats.ts            # per-mode best %, streak, today's count
│   └── persist.ts          # localStorage adapter (versioned key namespace)
│
├── components/             # design-system primitives
│   ├── Button.tsx          # primary + secondary
│   ├── AnswerChip.tsx
│   ├── BarDivider.tsx
│   ├── StaffOrnament.tsx   # the faint 5-line background
│   ├── FeedbackLine.tsx
│   └── ModeCard.tsx        # shared by Home (instruments) + InstrumentPage (modes)
│
├── views/                  # one per route
│   ├── Home.tsx            # instrument picker — 2 cards
│   ├── InstrumentPage.tsx  # mode picker for a chosen instrument — 3 cards
│   ├── Exercise.tsx        # shared shell for the three implemented modes
│   ├── Settings.tsx
│   └── modes/
│       ├── PianoNoteAnswers.tsx
│       ├── GuitarChordAnswers.tsx
│       └── GuitarProgressionAnswers.tsx
│
└── lib/
    ├── route.ts            # tiny hash-route helpers
    └── shortcuts.ts        # keyboard shortcut hook
```

### State shape

Each mode has a `level` (1–5) that drives a set of fine-tune knobs through a preset table. Users can override individual knobs; doing so flips that mode's `level` to `'custom'`.

A `Mode` is one of a fixed set of `${Instrument}-${Activity}` ids. The matrix is ragged — not every product cell exists. `INSTRUMENT_ACTIVITIES` is the source of truth for which activities each instrument exposes; the picker iterates that map.

```ts
type Instrument = 'piano' | 'guitar' | 'bass';
type Activity   = 'note' | 'chord' | 'prog' | 'roots';

type Mode =
  | 'piano-note'  | 'piano-chord'  | 'piano-prog'
  | 'guitar-note' | 'guitar-chord' | 'guitar-prog'
  | 'bass-note'   | 'bass-roots';

const INSTRUMENT_ACTIVITIES: Record<Instrument, Activity[]> = {
  piano:  ['note', 'chord', 'prog'],
  guitar: ['note', 'chord', 'prog'],
  bass:   ['note', 'roots'],          // bassline; bass skips chord/prog
};

const IMPLEMENTED_MODES: ReadonlySet<Mode> = new Set([
  'piano-note', 'piano-chord', 'piano-prog',
  'guitar-note', 'guitar-chord', 'guitar-prog',
  'bass-note', 'bass-roots',
]);

type Level = 1 | 2 | 3 | 4 | 5 | 'custom';

type PianoNoteKnobs = {
  pool:   'tonic-triad' | 'diatonic' | 'diatonic+accidentals' | 'chromatic';
  range:  [Midi, Midi];
  labels: 'solfege' | 'numeric';
};

// Reference tonic is no longer a knob — it's always available as a manual
// `▶ do` button on the exercise screen. See wireframe.md.

type GuitarChordKnobs = {
  pool:    ChordName[];
  voicing: 'fixed' | 'varied';
};

type GuitarProgKnobs = {
  key:        PitchClass;
  length:     3 | 4;
  pool:       RomanNumeral[];   // diatonic + extensions
  tempo:      'slow' | 'medium' | 'fast';
  showRoman:  boolean;
};

type Settings = {
  pianoNote:   { level: Level; knobs: PianoNoteKnobs };
  guitarChord: { level: Level; knobs: GuitarChordKnobs };
  guitarProg:  { level: Level; knobs: GuitarProgKnobs };
};

type Stats = {
  [mode in Mode]: {
    bestPct: number;          // best session accuracy, ever
    streakDays: number;       // consecutive days with ≥ 1 correct take
    lastPlayedISO: string;
    today: { correct: number; total: number; dateISO: string };
  };
};

type ExerciseState =
  | { phase: 'idle';      question: Question }
  | { phase: 'played';    question: Question; playedAt: number }
  | { phase: 'answered';  question: Question; userAnswer: Answer; correct: boolean };
```

The `level → knobs` preset table lives in a single config module (`exercises/levels.ts`). Setting `level` writes its preset into `knobs`; setting any `knobs.*` directly flips `level` to `'custom'` without changing other knobs. This is the entire complexity model.

Persistence keys: `attune:settings:v1`, `attune:stats:v1`. Version the key so future schema changes don't corrupt user data.

### Exercise contract

Every exercise module exports the same shape — this is what lets the `Exercise.tsx` shell stay generic:

```ts
type ExerciseModule<Q, A> = {
  name: Mode;
  generate(settings: Settings): Q;
  play(question: Q, audio: AudioContext): Promise<void>;
  AnswerComponent: React.FC<{ question: Q; onSubmit: (a: A) => void }>;
  isCorrect(question: Q, answer: A): boolean;
  describe(question: Q): string;   // for the feedback line ("mi · 3rd")
};
```

### Routing

Hash routes mirror the picker tree: `#/{instrument}` for the mode picker and `#/{instrument}/{activity}` for the exercise.

| Route | View |
|---|---|
| `/` | `Home` (instrument picker) |
| `#/piano`, `#/guitar` | `InstrumentPage` (mode picker) |
| `#/piano/note` | `Exercise mode='piano-note'` |
| `#/guitar/chord` | `Exercise mode='guitar-chord'` |
| `#/guitar/prog` | `Exercise mode='guitar-prog'` |
| `#/settings` | `Settings` |

All eight `{instrument}/{activity}` cells route to a working exercise. Routing to an invalid pair (e.g. `/bass/chord` — bass doesn't have a chord activity) falls back to that instrument's mode picker. The picker only renders activity cards from `INSTRUMENT_ACTIVITIES[instrument]`, so users never reach an invalid URL through normal navigation. The disabled "(coming soon)" card variant is retained for forward compatibility with mid-development additions.

Legacy deep links from the pre-matrix shape (`#/piano-note`, `#/guitar-chord`, `#/guitar-prog`) redirect to the new `{instrument}/{activity}` form. The redirect is a one-line shim in `lib/route.ts` and can be removed once the wild-link half-life passes.

## Milestones

Each milestone is independently demoable. Don't start the next until the previous is shipped end-to-end.

### M0 — Scaffold (½ day)

- `npm create vite@latest` — React + TS template.
- Add Tailwind v4, configure `@theme` with the `design.md` tokens.
- Add Fraunces + Inter via Google Fonts (or self-host if licensing allows).
- Set up GitHub Actions deploy workflow targeting `gh-pages` / Pages.
- Push a "hello, ear trainer" page styled per `design.md` to confirm the deploy pipeline works.

**Done when:** a styled placeholder page is live at the GitHub Pages URL.

### M1 — Audio plumbing probe (½ day)

- Write `audio/instrument.ts` and `audio/theory.ts`.
- Load piano + guitar SoundFonts on demand, cache them.
- Throwaway test page: buttons for "play C4 piano," "strum E major guitar."
- **Listen.** Compare against a real piano + real guitar mentally. If guitar sounds plasticky, decide between (a) better SoundFont, (b) pre-rendered samples for chords, (c) accept it.

**Done when:** the audio is acceptable enough that you'd actually use it for ear training.

### M2 — Piano single note end-to-end (1–2 days)

- Build `views/Home.tsx` (instrument picker — 2 cards).
- Build `views/InstrumentPage.tsx` (mode picker — 3 cards; disabled cards for unimplemented activity cells).
- Build `views/Exercise.tsx` shell.
- Build `exercises/pianoNote.ts` — generate, play (reference tonic → target, per knob policy), validate.
- Build `exercises/levels.ts` with the piano-note level table populated.
- Build `views/modes/PianoNoteAnswers.tsx` — solfege chip layout.
- Wire keyboard shortcuts (space = play/loop, 1–7 = pick, enter = next take).
- `state/stats.ts` — track today's accuracy and streak.
- Use `take` / `loop` / `next take` vocabulary throughout per `design.md`.

**Done when:** a user can complete 10 piano-note takes at level 1 (warmup), see their accuracy update, refresh the page and see the streak persist.

### M3 — Settings + level system (1 day)

- Build `views/Settings.tsx` (drawer on desktop, full screen on mobile).
- Build the **level slider** primary control, with name subtitle (warmup/session/gig/studio/mastering).
- Build the **fine-tune** disclosure with all piano-note knobs (pool, reference, range, labels).
- Wire knob → settings reducer; flip mode's level to `'custom'` when a knob is overridden.
- Reset-progress button.
- Visual polish: motion timings per `design.md`, focus rings, mobile breakpoints.

**Done when:** every level 1–5 produces noticeably different piano-note takes, fine-tune knobs work, custom state survives a refresh, and the piano mode picker shows the current level on the `single note` card.

### M4 — Guitar chord (1 day)

- `exercises/guitarChord.ts` — pick a chord from the pool, play a strummed voicing.
- Add guitar-chord level table to `exercises/levels.ts`.
- `views/modes/GuitarChordAnswers.tsx` — chord chips.
- Settings: level slider + chord-pool fine-tune (checkbox grid) + voicing toggle.

**Done when:** the chord mode has the same loop quality as piano: take → play → answer → feedback → next take, with all 5 levels working.

### M5 — Guitar progression (1.5 days)

- `exercises/guitarProgression.ts` — build a progression from the active pool of roman numerals in the chosen key. Play in sequence with a brief gap; tempo per knob.
- Add guitar-progression level table to `exercises/levels.ts`.
- `views/modes/GuitarProgressionAnswers.tsx` — slot-based answer UI; tap chip to fill next slot, tap slot to clear.
- Subtitle on this mode: **"name the changes."**
- Roman-numeral toggle in settings; per-slot feedback after submit.

**Done when:** all eight matrix cells are usable end-to-end at all 5 levels, and each per-instrument mode picker shows real stats + current level for each card.

### M6 — Polish (1 day, ongoing)

- Accessibility audit (contrast, screen reader, reduced motion).
- Mobile audit (real devices, not just narrow viewport).
- First-run hint for keyboard shortcuts.
- Favicon (a sharp ♯ glyph).
- README and short usage notes.
- Set up `actions/deploy-pages` to auto-publish on push to `main`.

**Done when:** you would feel comfortable showing it to another musician without preface.

## Deployment

- **Repo**: `github.com/<user>/attune`.
- **Workflow**: `.github/workflows/deploy.yml` — checkout, Node 20, `npm ci`, `npm run build`, upload `dist/` as Pages artifact, deploy. Runs on push to `main`.
- **Vite base path**: `base: '/attune/'` if deploying to a project page, `'/'` if a custom domain. (Decision deferred — see open decisions.)
- **No CDN dependencies for fonts in production** if you want offline-first; self-host Fraunces + Inter subsets via `@fontsource`.

## Testing strategy

- **Unit (Vitest)**: pure functions in `audio/theory.ts` (note→midi, scale-degree calc, chord-from-degree, diatonic chords for a key) and exercise generators (correctness check, deterministic with seed). These have real correctness criteria and are cheap to cover.
- **Audio sanity**: `tmp/audio-probe.html` checked in; manual listening before each milestone.
- **Smoke (Playwright)** *optional, after v1*: load home, click a card, click play, confirm answer chips render. Doesn't validate audio — that's the human's job.
- **No exhaustive component tests.** They rot; the design will change.

## Settled decisions (locked in)

- **Project name**: `attune`.
- **Voice**: contemporary studio vocabulary (`take`, `loop`, `next take`, `name the changes`); no Italian classical terms.
- **Reference tonic**: configurable per level (default `every` at L1–L2, `first` at L3–L4, `never` at L5).
- **Chord pool / progression length / etc.**: all governed by per-mode level tables in `exercises/levels.ts`. No "default pool" debate — level 1 is the default for everyone.
- **Audio**: SoundFont via `soundfont-player`, gated by an M1 listening test.

## Open decisions

1. **`base` path** — project page (`/attune/`) or custom domain (`/`)? Determines Vite config and the GitHub Actions workflow shape. Pick before M0 lands.
2. **Level → knob preset tables** for the three modes. Piano table sketched in `wireframe.md`; guitar-chord and guitar-progression tables need filling in before M4 / M5 respectively. Easy to iterate on once the level UI is in place.

## Risks

- **Audio quality.** Biggest single risk. Mitigated by M1's explicit listen-before-build gate. If guitar SoundFonts sound bad, fall back to pre-rendered MP3s per chord (more work, less generality, but ships).
- **iOS Safari audio unlock.** Web Audio requires a user gesture on iOS; first play tap will need to also `resume()` the AudioContext. Standard pattern; apply in `audio/instrument.ts`.
- **SoundFont licensing.** Confirm the chosen `.sf2` permits redistribution. MuseScore General SF (MIT-ish) is safe; some "free" packs are not.
- **Bundle size.** SoundFonts can be large. Lazy-load per mode (don't ship guitar samples to a piano-only user).

## What's deferred to v2

- Light mode.
- Adaptive difficulty (gradually expand chord pool as accuracy stays high).
- More exercises: intervals, scale identification, melodic dictation.
- Specialization of the cross-instrument modes — piano-friendly curated chord voicings, a fretboard-style answer area for guitar single note, walking-style bass arpeggiation for bassline mode, distinct level tables tuned per instrument. Shared infrastructure ships first; specialization is driven by ear-testing feedback.
- Additional instruments (voice, drums-as-pitch, etc.) — adding to `Instrument` and `INSTRUMENT_ACTIVITIES` is the entire schema change.
- Bass chord progression mode (would need a bass-arpeggio playback scheme: root + 5th + root pattern outlining harmony). Skipped from v1 because bass + bassline already covers root-listening; chord-quality recognition on bass is rarer in practice.
- Per-instrument settings reorganization (currently one section per mode = eight sections; regrouping by instrument waits until the section list grows or feedback says it should).
- Custom progressions / user-curated chord pools.
- Per-question timing / decision-time stats.

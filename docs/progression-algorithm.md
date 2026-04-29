# Chord Progression Generation

How `guitar-prog` builds the question. v1 ships as **template-based**; v2 expands into transition-weighted generation once the template library proves limiting.

## Why not random?

The current `generateGuitarProgQuestion` (see [`src/exercises/guitarProgression.ts`](../src/exercises/guitarProgression.ts)) picks each chord uniformly at random from the pool, with the only constraints being "start on I" and "no immediate repeats." That works at L1 with 3 chords but degrades fast:

- Sequences like `I → vii° → iii → IV` are technically diatonic but musically unmotivated — no functional logic, no cadence, no resolution.
- As pools grow to include tensions and borrowed chords (planned for L4-L5+), uniform sampling makes them appear with the same frequency as plain triads, which sounds jarring rather than sophisticated.
- The exercise stops training the ear on **what real progressions sound like** and starts training it on a chord-recognition stream.

## v1: function-tagged templates

Two pieces: tag every chord by harmonic function, then fill cadence shells whose slots are either function tags or pinned Romans. The slot model — mixing function tags with literals — is what makes the system both **flexible** (PD/D pull from pool variety) and **iconic** (`Axis` always reads as I-V-vi-IV).

### Function tags

Every Roman in the diatonic pool maps to exactly one of three tags. Tensions inherit their parent's function, so the function map is the only thing that grows when the pool expands.

| Function | Diatonic | With tensions (later) |
|---|---|---|
| **T** (tonic) | `I`, `iii`, `vi` | `Imaj7`, `iii7`, `vi7` |
| **PD** (predominant) | `ii`, `IV` | `ii7`, `IVmaj7` |
| **D** (dominant) | `V`, `vii°` | `V7`, `vii°7`, `V7sus4` |

Borrowed and secondary chords (v2) map by their *target* function: `V/V` → D, `iv` borrowed from minor → PD, `bVII` → PD or D depending on context.

### Slot model

A template is an ordered list of slots. Each slot is **either** a literal Roman **or** a function tag.

```ts
type RomanFunction = 'T' | 'PD' | 'D';
type Slot          = Roman | RomanFunction;     // string union, no wrapper

type Template = {
  name:     string;       // 'authentic', 'doo-wop', 'axis', ...
  slots:    Slot[];
  minLevel: 1 | 2 | 3 | 4 | 5;
};

const FUNCTION_OF: Record<Roman, RomanFunction> = {
  I: 'T', iii: 'T', vi: 'T',
  ii: 'PD', IV: 'PD',
  V: 'D', 'vii°': 'D',
};

const FUNCTION_MEMBERS: Record<RomanFunction, Roman[]> = {
  T:  ['I', 'iii', 'vi'],
  PD: ['ii', 'IV'],
  D:  ['V', 'vii°'],
};
```

Resolution at fill time:
- Literal slot (e.g. `'vi'`) → must produce that exact Roman.
- Function slot (e.g. `'PD'`) → pick uniformly from `pool ∩ FUNCTION_MEMBERS[fn]`.

### Template library (v1)

Anchored on `I` at position 0. Final slot is literal where the cadence's identity demands it (Authentic ends on `I`, Deceptive on `vi`, Half-cadence on `D`); otherwise it's a function tag. Each template is fixed-length; no template tries to span both length 3 and length 4.

| Name | Slots | Length | Min level | Notes |
|---|---|---|---|---|
| `authentic-short` | `I, PD, D` | 3 | 1 | Compact V-resolution-implied cadence |
| `plagal-short` | `I, IV, I` | 3 | 1 | "Amen" |
| `authentic` | `I, PD, D, I` | 4 | 1 | Textbook |
| `plagal` | `I, T, PD, I` | 4 | 1 | T at slot 1 lets it be I/iii/vi |
| `doo-wop` | `I, vi, PD, D` | 4 | 2 | 50s — `vi` pinned, PD/D flex |
| `axis` | `I, V, vi, IV` | 4 | 2 | All literal — iconic shape |
| `deceptive` | `I, PD, D, vi` | 4 | 3 | Avoided resolution |
| `half-cadence` | `I, PD, T, D` | 4 | 3 | Ends unresolved on D |
| `turnaround` | `I, vi, ii, V` | 4 | 4 | Jazz cycle |
| `12-bar-compressed` | `I, IV, I, V` | 4 | 4 | Blues skeleton |

Excluded from v1 (require Romans not in the current `Roman` union): Backdoor (`bVII`), Andalusian (`i, bVII, bVI, V` — minor key), modal cadences. Add in v2 once the type expands.

### Pool eligibility

A template is eligible for a question iff:

1. Its `length` matches the requested length knob.
2. Its `minLevel` ≤ current level.
3. Every literal slot's Roman is in `pool`.
4. Every function slot has at least one member in `pool` (`pool ∩ FUNCTION_MEMBERS[fn] ≠ ∅`).

If no template is eligible, fall through to the **legacy uniform-random generator** (today's algorithm). This keeps the system robust under unusual custom pools — e.g., a user removes `V` and `vii°`, leaving no D-function chord; rather than crash, we hand back to v0.

### Generation algorithm

```text
generate(pool: Roman[], length: number, level: 1..5, key: ProgKey):
  eligible = TEMPLATES.filter(t =>
    t.slots.length === length
    && t.minLevel <= level
    && every slot in t.slots is satisfiable by pool
  )

  if eligible.length === 0:
    return legacyRandom(pool, length, key)   // existing algorithm

  template = pickUniform(eligible)
  result: Roman[] = []

  for i in 0 .. template.slots.length - 1:
    s = template.slots[i]
    candidates =
      s is Roman literal   -> [s]
      s is function tag F  -> pool ∩ FUNCTION_MEMBERS[F]

    // anti-stagnation: if filling a function slot whose tag matches
    // the previous chord's function and alternatives exist, avoid the
    // repeat. Covers both function-after-function (T, T, ...) and the
    // literal-followed-by-same-function case (literal I followed by a
    // T slot — pool may offer iii or vi, prefer those).
    if isFunctionTag(s)
       && i > 0
       && candidates.length > 1
       && FUNCTION_OF[result[i-1]] === s:
      candidates = candidates.filter(c => c !== result[i-1])

    result.push(pickUniform(candidates))

  return {
    key,
    progression: result.map(r => romanToChord(r, key)),
    templateName: template.name,   // debug only
    poolChords:   pool.map(r => romanToChord(r, key)),
  }
```

Notes on the rules:
- **Repetition is allowed by default** — Plagal's `I, T, PD, I` legitimately reuses `I` at positions 0 and 3 (non-consecutive). The anti-stagnation filter only fires when filling a function slot whose tag matches the *immediately preceding* chord's function, and alternatives exist — preventing dead "I → I" steps in rich pools while leaving sparse pools (e.g., T slot with only `I` available) free to repeat.
- **Literal slots are strict.** If a template needs `vi` and the pool excludes it, the template is ineligible — we don't substitute another T-function chord for it. (The whole point of pinning `vi` in Doo-wop is that it has to be `vi`.)
- **Tonic anchor is enforced via the literal slot at position 0**, not a special-case rule. Every v1 template starts with `I`.
- **No "prefer I 80%" weighting on the final slot.** Either it's literal (we know what to play) or it's a function tag (uniform pick). Future weighting goes in v2 alongside Markov transitions.

### Worked examples

**Pool `[I, IV, V]`, length 4, level 1.**
Eligible: `authentic` (PD=`{IV}`, D=`{V}` — OK), `plagal` (T=`{I}`, PD=`{IV}` — OK). Doo-wop fails (no `vi`). Axis fails (no `vi`).
Pick `plagal`: slots `[I, T, PD, I]` → `[I, I, IV, I]`. Anti-stagnation cannot trigger (slot 1 is T, slot 0 is literal `I` — not same function-tag-to-function-tag). The `I → I` step is preserved here because that's literally what Plagal does in this minimal pool.

**Pool `[I, ii, IV, V, vi]`, length 4, level 3.**
Eligible at L≤3: `authentic`, `plagal`, `doo-wop`, `deceptive`, `half-cadence` (axis needs all of I/V/vi/IV — yes, eligible too).
Say we pick `doo-wop` `[I, vi, PD, D]`: slot 2 PD ∈ {ii, IV}, slot 3 D ∈ {V}. Roll `ii`, then `V`. Result: `[I, vi, ii, V]`.

**Pool `[I, V, vi, IV]`, length 4, level 5.**
Many eligible. Say we pick `axis` `[I, V, vi, IV]`: every slot literal. Result is exactly `I, V, vi, IV` — the iconic 4-chord pop loop.

**Pool `[I, ii]`, length 4, level 5.**
No D-function chord in pool. `authentic`/`doo-wop`/`half-cadence`/`turnaround`/`12-bar` all need D. `plagal` needs PD ✓ and T ✓ — eligible. `deceptive` needs D — no. Fallback may also kick in if eligibility is empty after further restrictions; legacy-random handles it.

### What this preserves

- Pool knob still controls vocabulary; templates only fire if the pool can satisfy them.
- Level knob now gates template variety in addition to chord count.
- `I` stays the anchor, so the tonic reference grounds the listener at every question.
- `playGuitarProgQuestion`, `perSlotFeedback`, `isCorrectProgression`, and the answer UI are unchanged.
- The legacy generator stays in the file as the fallback path, so we lose nothing.

### What this changes

- New module `src/exercises/progressionTemplates.ts` exports `TEMPLATES`, `FUNCTION_OF`, `FUNCTION_MEMBERS`, plus `Template`/`Slot`/`RomanFunction` types.
- `generateGuitarProgQuestion` in `src/exercises/guitarProgression.ts` becomes the template-aware version with a `legacyRandomGenerate` private function as fallback.
- `GuitarProgQuestion` gains `templateName?: string` for debugging/telemetry; not rendered.
- No changes to `levels.ts` — templates self-gate via `minLevel`. Level presets continue to control pool/length/tempo only.

### Implementation order

1. Add `RomanFunction`, `Slot`, `Template` types and `FUNCTION_OF` / `FUNCTION_MEMBERS` constants. Unit-test `functionOf` for every member of the `Roman` union.
2. Add `TEMPLATES` library with the 10 v1 entries above. Unit-test that every literal slot uses a Roman in the union and every function slot tag is valid.
3. Implement `eligibleTemplates(pool, length, level)` and unit-test with the worked examples above.
4. Implement `fillTemplate(template, pool)` with the anti-stagnation rule. Unit-test repetition behavior on `plagal` with single-T pools and multi-T pools.
5. Wire into `generateGuitarProgQuestion` with legacy fallback. Keep `legacyRandomGenerate` exported for tests.
6. Manual ear-test L1→L5 across every mode preset before considering this done.

### Open decisions (defer)

- **History-aware selection** — should we avoid repeating the same template back-to-back across questions? Probably yes once we observe fatigue, but it requires threading question history through the generator, which v0 doesn't do.
- **Tension substitution at literal slots** — if pool has both `I` and `Imaj7`, does literal `I` randomize between them? Default answer: no, literals stay strict; users add tensions to the pool to hear them in *function* slots. Revisit if it feels too rigid.
- **Length-3 template variety** — currently only two (`authentic-short`, `plagal-short`). If L1 with length 3 feels monotonous, add `T - PD - D` and `I - V - vi` as additional shells.
- **Weighting per level** — at L5 should `axis` and `turnaround` outweigh `authentic`? Defer to v2 alongside Markov.

## Complexity scaling

Three orthogonal axes drive level difficulty. The template system handles **form**; the chord library expansion (see [`src/exercises/chordLibrary.ts`](../src/exercises/chordLibrary.ts)) unlocks **harmonic colour**; the existing Roman pool controls **vocabulary scope**.

| Axis | Knob | What grows |
|---|---|---|
| Form | template `minLevel`, `length`, `tempo` | available cadences, chord count, recognition speed |
| Vocabulary | `pool: Roman[]` | which functions appear (I/IV/V → all diatonic → +secondary dominants → +modal interchange) |
| Colour | `qualityScheme` | how each Roman is voiced (triad → 7th → 9th/13 → altered) |

The pedagogical insight: at L3+ the same `I-V-vi-IV` form sounds like `Cmaj7 G7 Am7 Fmaj7` (diatonic-7ths) or `Cmaj9 G13 Am9 F6/9` (extensions) or `Cmaj9 G7#9 Am9 Fmaj7` (altered). The shape is constant; the colour is the discrimination target. That's a real ear-training jump without changing the algorithm.

### qualityScheme

Five schemes, ordered by harmonic richness. The generator picks one quality uniformly per slot per question, so the same template at richer schemes still yields varied chord names across takes.

```ts
type QualityScheme =
  | 'triads'         // plain triads everywhere
  | 'triads+V7'      // dominant gets a 7; everything else stays triad
  | 'diatonic-7ths'  // every Roman → its diatonic 7th
  | 'extensions'     // 7ths plus 9/13 (random per slot)
  | 'altered';       // dominants gain b9 / #9 (random per slot)
```

Per-Roman quality candidates:

| Roman → root | `triads` | `triads+V7` | `diatonic-7ths` | `extensions` | `altered` |
|---|---|---|---|---|---|
| **I** → C | `''` | `''` | `maj7` | `maj7`, `maj9`, `6/9` | `maj7`, `maj9`, `6/9` |
| **ii** → D | `m` | `m` | `m7` | `m7`, `m9` | `m7`, `m9` |
| **iii** → E | `m` | `m` | `m7` | `m7` | `m7` |
| **IV** → F | `''` | `''` | `maj7` | `maj7`, `maj9`, `6/9` | `maj7`, `maj9`, `6/9` |
| **V** → G | `''` | `7` | `7` | `7`, `9`, `13` | `7`, `9`, `13`, `7b9`, `7#9` |
| **vi** → A | `m` | `m` | `m7` | `m7`, `m9` | `m7`, `m9` |
| **vii°** → B | `dim` | `dim` | `m7b5` | `m7b5` | `m7b5` |

`iii` and `vii°` stay at their basic 7th even at richer schemes — their natural 9 is a b9 above the root and clashes; standard practice avoids extending them.

### Level presets

Each level layers form, vocabulary, and colour together. The Roman pool stops growing at L3 (full diatonic); L4 and L5 turn the difficulty crank via colour and tempo.

| Level | Roman pool | qualityScheme | Length | Tempo | Templates available |
|---|---|---|---|---|---|
| **L1** warmup | I, IV, V | `triads` | 3 | slow | `authentic-short`, `plagal-short` |
| **L2** session | I, ii, IV, V, vi | `triads+V7` | 4 | slow | + `authentic`, `plagal`, `axis`, `doo-wop` |
| **L3** gig | I, ii, iii, IV, V, vi, vii° | `diatonic-7ths` | 4 | medium | + `deceptive`, `half-cadence` |
| **L4** studio | (same as L3) | `extensions` | 4 | medium | + `turnaround`, `12-bar-compressed` |
| **L5** mastering | (same as L3) | `altered` | 4 | fast | (all, same library) |

### Answer chip pool sizes

Answer is by ChordName, so every possible chord per pool × scheme must appear as a chip. `poolChordsFor(pool, scheme)` derives this set so the chip palette tracks the question's possibilities exactly.

| Level | Possible ChordNames | Chip count |
|---|---|---|
| L1 | C, F, G | 3 |
| L2 | C, Dm, F, G7, Am | 5 |
| L3 | Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7b5 | 7 |
| L4 | + Cmaj9, C6/9, Dm9, Fmaj9, F6/9, G9, G13, Am9 | 15 |
| L5 | + G7b9, G7#9 | 17 |

15-17 chips at L4-L5 is the UX pressure point. The `DISPLAY_ORDER` constant in `GuitarProgressionAnswers.tsx` groups chips by Roman function then by colour (triad → 7th → extension → altered) to keep the wall scannable. If chip count gets unwieldy in practice, the deferred answer-by-Roman toggle is the escape valve.

### Generator integration

```ts
// progressionTemplates.ts
const ROMAN_ROOTS: Record<Roman, Root> = {
  I: 'C', ii: 'D', iii: 'E', IV: 'F', V: 'G', vi: 'A', 'vii°': 'B',
};

const QUALITY_CANDIDATES: Record<QualityScheme, Record<Roman, ChordSuffix[]>> = {
  triads:        { ... },
  'triads+V7':   { ... },
  'diatonic-7ths': { ... },
  extensions:    { ... },
  altered:       { ... },
};

// Replaces the old `romans.map(r => romanToChord(r, key))` step.
function romansToChords(romans: Roman[], scheme: QualityScheme): ChordName[] {
  return romans.map(r => {
    const candidates = QUALITY_CANDIDATES[scheme][r];
    const suffix = candidates[Math.floor(Math.random() * candidates.length)];
    return `${ROMAN_ROOTS[r]}${suffix}` as ChordName;
  });
}

// Drives the answer chip palette.
function poolChordsFor(pool: Roman[], scheme: QualityScheme): ChordName[] {
  return pool.flatMap(r =>
    QUALITY_CANDIDATES[scheme][r].map(s => `${ROMAN_ROOTS[r]}${s}` as ChordName));
}
```

`romanToChord(r, 'C')` (the legacy 1:1 triad mapping in `chords.ts`) is kept for any caller that still wants the diatonic triad, but the generator uses the scheme-aware path. `key: ProgKey` only matters once we add multi-key — currently `key` always resolves to C, so the root letters are hard-coded; multi-key adds a per-key root map.

### Persistence

`qualityScheme` is a new field on `GuitarProgKnobs`. The generator defaults missing values to `'triads'`, so settings persisted before this change load harmlessly without a storage-key bump.

### What's deferred

- **Secondary dominants** (`V/V`, `V/vi`) and **modal interchange** (`bVII`, `iv`, `bIII`, `bVI`) — would expand the `Roman` type and `FUNCTION_OF`, plus need new templates that use them at specific slots. Push to a later "advanced" track.
- **Multi-key** — `key: ProgKey` is currently always `'C'`. Adds key-memorization on top of harmonic ID; separate dial from level.
- **Voicing variation** (drop-2, drop-3, inversions, slash chords) — sonic dimension orthogonal to qualities; depends on slash-chord support in the chord library.
- **Answer-by-Roman toggle** — the existing `showRoman` knob becomes a difficulty switch (off = pick by chord name, harder; on = pick by Roman, easier). Flip when chip count gets unwieldy in practice.

## v2: transition-weighted generation

Triggered when templates feel repetitive in real use. Two non-exclusive directions:

1. **Markov weights** — replace the "pick uniformly within function" step with a transition table: from `V`, weight `I = 0.6`, `vi = 0.2` (deceptive), `IV = 0.1`, others = 0.1. Tunable per level. Keeps the template skeleton; just makes slot-filling smarter.
2. **Template generator** — instead of a hand-curated list, generate templates on the fly from a function grammar (`T → T | T PD D T | T vi PD D ...`). Lets L5+ surface progressions the human author didn't enumerate.

Stretch: secondary dominants (`V/V`, `V/vi`) and modal interchange (`bVII`, `iv`) as separate function tags that splice into existing templates at specific slots.

## Calibration notes

When this lands, watch for:
- **L1, length 3, pool `{I, IV, V}`** — only `authentic-short` and `plagal-short` are eligible. If that feels monotonous, extend the length-3 sub-library before reaching for v2.
- **`deceptive` at L3** — users will instinctively guess `I` at the end. Correct-answer feedback teaches the surprise; that's the cadence doing its job, not a bug.
- **`half-cadence`** — ends on D, which sounds "wrong" to ears trained on full resolution. Worth keeping at L3+ specifically because it teaches resolution recognition. If feedback says it's confusing, gate to L4+.
- **`12-bar-compressed` at L4-L5** — only fires if pool happens to support it; in strict diatonic pools it'll feel out of place because nothing else in the system gestures toward blues. Consider gating behind a future "blues" toggle in fine-tune.
- **Pool with no D-function chord** — fallback to legacy random. Worth a small UI note in Settings ("removing V and vii° disables cadence templates") if users hit this.

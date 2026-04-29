import type { ChordName, ChordSuffix, Roman, Root } from './chords';

export type RomanFunction = 'T' | 'PD' | 'D';
export type Slot = Roman | RomanFunction;

export type Template = {
  name: string;
  slots: Slot[];
  minLevel: 1 | 2 | 3 | 4 | 5;
};

export const FUNCTION_OF: Record<Roman, RomanFunction> = {
  'I':    'T',
  'iii':  'T',
  'vi':   'T',
  'ii':   'PD',
  'IV':   'PD',
  'V':    'D',
  'vii°': 'D',
};

export const FUNCTION_MEMBERS: Record<RomanFunction, Roman[]> = {
  T:  ['I', 'iii', 'vi'],
  PD: ['ii', 'IV'],
  D:  ['V', 'vii°'],
};

export function isFunctionTag(s: Slot): s is RomanFunction {
  return s === 'T' || s === 'PD' || s === 'D';
}

export const TEMPLATES: Template[] = [
  { name: 'authentic-short',   slots: ['I', 'PD', 'D'],       minLevel: 1 },
  { name: 'plagal-short',      slots: ['I', 'IV', 'I'],       minLevel: 1 },
  { name: 'authentic',         slots: ['I', 'PD', 'D', 'I'],  minLevel: 1 },
  { name: 'plagal',            slots: ['I', 'T', 'PD', 'I'],  minLevel: 1 },
  { name: 'doo-wop',           slots: ['I', 'vi', 'PD', 'D'], minLevel: 2 },
  { name: 'axis',              slots: ['I', 'V', 'vi', 'IV'], minLevel: 2 },
  { name: 'deceptive',         slots: ['I', 'PD', 'D', 'vi'], minLevel: 3 },
  { name: 'half-cadence',      slots: ['I', 'PD', 'T', 'D'],  minLevel: 3 },
  { name: 'turnaround',        slots: ['I', 'vi', 'ii', 'V'], minLevel: 4 },
  { name: '12-bar-compressed', slots: ['I', 'IV', 'I', 'V'],  minLevel: 4 },
];

function slotSatisfiable(s: Slot, pool: Roman[]): boolean {
  if (isFunctionTag(s)) {
    return FUNCTION_MEMBERS[s].some((r) => pool.includes(r));
  }
  return pool.includes(s);
}

export function eligibleTemplates(
  pool: Roman[],
  length: number,
  level: 1 | 2 | 3 | 4 | 5,
): Template[] {
  return TEMPLATES.filter(
    (t) =>
      t.slots.length === length &&
      t.minLevel <= level &&
      t.slots.every((s) => slotSatisfiable(s, pool)),
  );
}

function pickUniform<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// ────────── quality scheme: harmonic-colour layer ──────────
//
// Roman selection picks the function (e.g. V); the scheme picks the quality
// that voices it (G triad, G7, G9, G7b9, ...). This decouples form from
// colour so the same template at different schemes sounds dramatically
// different without changing the algorithm.

export type QualityScheme =
  | 'triads'
  | 'triads+V7'
  | 'diatonic-7ths'
  | 'extensions'
  | 'altered';

export const ALL_QUALITY_SCHEMES: readonly QualityScheme[] = [
  'triads',
  'triads+V7',
  'diatonic-7ths',
  'extensions',
  'altered',
] as const;

// Roman → root letter in C major. Multi-key support changes only this map.
const ROMAN_ROOTS: Record<Roman, Root> = {
  I:    'C',
  ii:   'D',
  iii:  'E',
  IV:   'F',
  V:    'G',
  vi:   'A',
  'vii°': 'B',
};

// Per-scheme quality candidates per Roman. Each call to romansToChords picks
// one suffix uniformly from the candidate list, so the same template
// produces varied chord names across takes at richer schemes.
//
// iii and vii° stay at their basic 7th even at 'extensions' / 'altered':
// their 9th is a b9 above the root and clashes; standard practice avoids
// extending them.
export const QUALITY_CANDIDATES: Record<
  QualityScheme,
  Record<Roman, readonly ChordSuffix[]>
> = {
  triads: {
    I: [''], ii: ['m'], iii: ['m'], IV: [''], V: [''], vi: ['m'], 'vii°': ['dim'],
  },
  'triads+V7': {
    I: [''], ii: ['m'], iii: ['m'], IV: [''], V: ['7'], vi: ['m'], 'vii°': ['dim'],
  },
  'diatonic-7ths': {
    I: ['maj7'], ii: ['m7'], iii: ['m7'], IV: ['maj7'], V: ['7'], vi: ['m7'], 'vii°': ['m7b5'],
  },
  extensions: {
    I:    ['maj7', 'maj9', '6/9'],
    ii:   ['m7', 'm9'],
    iii:  ['m7'],
    IV:   ['maj7', 'maj9', '6/9'],
    V:    ['7', '9', '13'],
    vi:   ['m7', 'm9'],
    'vii°': ['m7b5'],
  },
  altered: {
    I:    ['maj7', 'maj9', '6/9'],
    ii:   ['m7', 'm9'],
    iii:  ['m7'],
    IV:   ['maj7', 'maj9', '6/9'],
    V:    ['7', '9', '13', '7b9', '7#9'],
    vi:   ['m7', 'm9'],
    'vii°': ['m7b5'],
  },
};

function pickQuality(scheme: QualityScheme, roman: Roman): ChordSuffix {
  const candidates = QUALITY_CANDIDATES[scheme][roman];
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

// Voice each Roman by combining its root with a scheme-picked quality.
// Replaces the old `romans.map(r => romanToChord(r, key))` step.
export function romansToChords(
  romans: Roman[],
  scheme: QualityScheme,
): ChordName[] {
  return romans.map((r) => `${ROMAN_ROOTS[r]}${pickQuality(scheme, r)}` as ChordName);
}

// Every ChordName the active pool × scheme could produce. Used to size the
// answer chip palette so it always covers the question's possibilities.
export function poolChordsFor(
  pool: Roman[],
  scheme: QualityScheme,
): ChordName[] {
  return pool.flatMap((r) =>
    QUALITY_CANDIDATES[scheme][r].map(
      (s) => `${ROMAN_ROOTS[r]}${s}` as ChordName,
    ),
  );
}

export function fillTemplate(template: Template, pool: Roman[]): Roman[] {
  const result: Roman[] = [];
  for (let i = 0; i < template.slots.length; i++) {
    const s = template.slots[i]!;
    let candidates: Roman[] = isFunctionTag(s)
      ? FUNCTION_MEMBERS[s].filter((r) => pool.includes(r))
      : [s];

    // Anti-stagnation: if filling a function slot whose function matches
    // the previous chord's function and alternatives exist, avoid the
    // repeat. Covers both function-after-function (T,T) and the literal-
    // after-function-of-same-class case (literal I followed by T slot).
    if (
      isFunctionTag(s) &&
      i > 0 &&
      candidates.length > 1 &&
      FUNCTION_OF[result[i - 1]!] === s
    ) {
      const filtered = candidates.filter((c) => c !== result[i - 1]);
      if (filtered.length > 0) candidates = filtered;
    }

    result.push(pickUniform(candidates));
  }
  return result;
}

import { midiToNote } from '../audio/theory';

// Both sharp and flat spellings are first-class. Pitch class is shared
// between enharmonic pairs (A# ≡ Bb, etc.) at the audio layer; the spelling
// is preserved in ChordName so callers can keep a jazz-flavored 'Eb7' or a
// rock-flavored 'D#7' as they prefer.
export type Root =
  | 'C' | 'C#' | 'Db'
  | 'D' | 'D#' | 'Eb'
  | 'E'
  | 'F' | 'F#' | 'Gb'
  | 'G' | 'G#' | 'Ab'
  | 'A' | 'A#' | 'Bb'
  | 'B';

// Display order: ascending by pitch class, sharp before flat for paired PCs.
export const ALL_ROOTS: readonly Root[] = [
  'C', 'C#', 'Db',
  'D', 'D#', 'Eb',
  'E',
  'F', 'F#', 'Gb',
  'G', 'G#', 'Ab',
  'A', 'A#', 'Bb',
  'B',
] as const;

// Order matters for parseChordName: 2-char roots must be tried before
// 1-char roots so 'C#m' parses as 'C#' + 'm', not 'C' + '#m'.
const ROOTS_LONGEST_FIRST: readonly Root[] = [
  'C#', 'Db', 'D#', 'Eb', 'F#', 'Gb', 'G#', 'Ab', 'A#', 'Bb',
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
] as const;

// Canonical chord-symbol suffixes. One spelling per quality — informal
// alternates ('M7' for 'maj7', '°' for 'dim', 'ø' for 'm7b5', 'min' for 'm')
// are not modeled. Add later via a normalization layer if needed.
export type ChordSuffix =
  // Triads & power
  | '' | 'm' | 'dim' | 'aug' | 'sus2' | 'sus4' | '5'
  // Sixths
  | '6' | 'm6' | '6/9' | 'm6/9'
  // Sevenths (basic)
  | '7' | 'maj7' | 'm7' | 'mMaj7' | 'dim7' | 'm7b5'
  // Sevenths (sus / altered)
  | '7sus4' | '7sus2' | '7b5' | '7#5' | 'maj7#5' | 'maj7b5'
  // Adds (no 7)
  | 'add9' | 'madd9' | 'add11' | 'madd11'
  // Ninths
  | '9' | 'maj9' | 'm9' | 'mMaj9' | '9sus4' | '7b9' | '7#9'
  // Elevenths
  | '11' | 'm11' | 'maj11' | '7#11' | 'maj7#11'
  // Thirteenths
  | '13' | 'maj13' | 'm13' | '13sus4';

export const ALL_SUFFIXES: readonly ChordSuffix[] = [
  '', 'm', 'dim', 'aug', 'sus2', 'sus4', '5',
  '6', 'm6', '6/9', 'm6/9',
  '7', 'maj7', 'm7', 'mMaj7', 'dim7', 'm7b5',
  '7sus4', '7sus2', '7b5', '7#5', 'maj7#5', 'maj7b5',
  'add9', 'madd9', 'add11', 'madd11',
  '9', 'maj9', 'm9', 'mMaj9', '9sus4', '7b9', '7#9',
  '11', 'm11', 'maj11', '7#11', 'maj7#11',
  '13', 'maj13', 'm13', '13sus4',
] as const;

export type ChordName = `${Root}${ChordSuffix}`;

export const ALL_CHORD_NAMES: readonly ChordName[] = ALL_ROOTS.flatMap(
  (r) => ALL_SUFFIXES.map((s) => `${r}${s}` as ChordName),
);

// Semitones from root for each quality. For chord types whose textbook
// formula contains an avoid-note conflict in standard practice (notably the
// dominant 11 omitting the 3rd), the practical voicing is used.
export const QUALITY_INTERVALS: Record<ChordSuffix, readonly number[]> = {
  // Triads & power
  '':       [0, 4, 7],
  m:        [0, 3, 7],
  dim:      [0, 3, 6],
  aug:      [0, 4, 8],
  sus2:     [0, 2, 7],
  sus4:     [0, 5, 7],
  '5':      [0, 7],

  // Sixths
  '6':      [0, 4, 7, 9],
  m6:       [0, 3, 7, 9],
  '6/9':    [0, 4, 7, 9, 14],
  'm6/9':   [0, 3, 7, 9, 14],

  // Sevenths (basic)
  '7':      [0, 4, 7, 10],
  maj7:     [0, 4, 7, 11],
  m7:       [0, 3, 7, 10],
  mMaj7:    [0, 3, 7, 11],
  dim7:     [0, 3, 6, 9],
  m7b5:     [0, 3, 6, 10],

  // Sevenths (sus / altered)
  '7sus4':  [0, 5, 7, 10],
  '7sus2':  [0, 2, 7, 10],
  '7b5':    [0, 4, 6, 10],
  '7#5':    [0, 4, 8, 10],
  'maj7#5': [0, 4, 8, 11],
  'maj7b5': [0, 4, 6, 11],

  // Adds (no 7)
  add9:     [0, 4, 7, 14],
  madd9:    [0, 3, 7, 14],
  add11:    [0, 4, 7, 17],
  madd11:   [0, 3, 7, 17],

  // Ninths
  '9':      [0, 4, 7, 10, 14],
  maj9:     [0, 4, 7, 11, 14],
  m9:       [0, 3, 7, 10, 14],
  mMaj9:    [0, 3, 7, 11, 14],
  '9sus4':  [0, 5, 7, 10, 14],
  '7b9':    [0, 4, 7, 10, 13],
  '7#9':    [0, 4, 7, 10, 15],

  // Elevenths. Dominant 11 traditionally omits the 3rd (avoid-note conflict
  // with the natural 11); minor and major 11 keep all chord tones.
  '11':       [0, 7, 10, 14, 17],
  m11:        [0, 3, 7, 10, 14, 17],
  maj11:      [0, 4, 7, 11, 14, 17],
  '7#11':     [0, 4, 7, 10, 14, 18],
  'maj7#11':  [0, 4, 7, 11, 14, 18],

  // Thirteenths. Standard practice omits the 11th to avoid the same
  // conflict; the 13 above the 7 is the colour the chord is named for.
  '13':     [0, 4, 7, 10, 14, 21],
  maj13:    [0, 4, 7, 11, 14, 21],
  m13:      [0, 3, 7, 10, 14, 21],
  '13sus4': [0, 5, 7, 10, 14, 21],
};

const ROOT_PC: Record<Root, number> = {
  C: 0,  'C#': 1,  Db: 1,
  D: 2,  'D#': 3,  Eb: 3,
  E: 4,
  F: 5,  'F#': 6,  Gb: 6,
  G: 7,  'G#': 8,  Ab: 8,
  A: 9,  'A#': 10, Bb: 10,
  B: 11,
};

export function parseChordName(name: ChordName): {
  root: Root;
  suffix: ChordSuffix;
} {
  for (const r of ROOTS_LONGEST_FIRST) {
    if (name.startsWith(r)) {
      const suffix = name.slice(r.length) as ChordSuffix;
      return { root: r, suffix };
    }
  }
  throw new Error(`Cannot parse chord name: ${name}`);
}

// Lowest MIDI value at this pitch class within E2..D#3 (40..51).
// Keeps every chord's bass note in a guitar-friendly low register.
export function lowOctaveRootMidi(root: Root): number {
  const pc = ROOT_PC[root];
  let m = 40;
  while (m % 12 !== pc) m++;
  return m;
}

// Bass-guitar register: one octave below the chord's root, in E1..D#2 (28..39).
// Used for bassline mode where bass doubles the chord root underneath.
export function bassOctaveRootMidi(root: Root): number {
  return lowOctaveRootMidi(root) - 12;
}

// Build a recognizable, register-balanced voicing from intervals alone.
// Sparse chords (≤4 chord tones — power, triads, 7ths) get an octave
// doubling at the top so they don't feel thin. Richer chords (9ths and up)
// already carry their own density and stay close-position.
export function synthesizeVoicing(
  root: Root,
  suffix: ChordSuffix,
): string[] {
  const intervals = QUALITY_INTERVALS[suffix];
  const rootMidi = lowOctaveRootMidi(root);
  const midis = intervals.map((i) => rootMidi + i);
  if (intervals.length <= 4) midis.push(rootMidi + 12);
  // Strum direction is low-to-high; sort so an octave doubling appended
  // after a high tension (e.g. madd11 = root + 17) still plays in order.
  midis.sort((a, b) => a - b);
  return midis.map(midiToNote);
}

import {
  getAudioContext,
  loadInstrument,
  type InstrumentName,
} from '../audio/instrument';
import {
  parseChordName,
  synthesizeVoicing,
  type ChordName,
} from './chordLibrary';

export type {
  ChordName,
  ChordSuffix,
  Root,
} from './chordLibrary';
export {
  ALL_CHORD_NAMES,
  ALL_ROOTS,
  ALL_SUFFIXES,
  QUALITY_INTERVALS,
  parseChordName,
  synthesizeVoicing,
  lowOctaveRootMidi,
  bassOctaveRootMidi,
} from './chordLibrary';

// Hand-tuned open-position voicings. Anything not listed here is
// synthesized at lookup time. These were verified by ear at M1 and
// remain the preferred voicing whenever the chord appears.
export const CURATED_VOICINGS: Partial<Record<ChordName, string[]>> = {
  A:     ['A2', 'E3',  'A3', 'C#4', 'E4'],
  Am:    ['A2', 'E3',  'A3', 'C4',  'E4'],
  A7:    ['A2', 'E3',  'A3', 'C#4', 'G4'],
  Am7:   ['A2', 'E3',  'G3', 'C4',  'E4'],
  Bdim:  ['B2', 'F3',  'B3', 'D4',  'F4'],
  C:     ['C3', 'E3',  'G3', 'C4',  'E4'],
  Cmaj7: ['C3', 'E3',  'G3', 'B3',  'E4'],
  D:     ['D3', 'A3',  'D4', 'F#4'],
  Dm:    ['D3', 'A3',  'D4', 'F4'],
  D7:    ['D3', 'A3',  'D4', 'F#4', 'C5'],
  Dm7:   ['D3', 'A3',  'D4', 'F4',  'C5'],
  E:     ['E2', 'B2',  'E3', 'G#3', 'B3', 'E4'],
  Em:    ['E2', 'B2',  'E3', 'G3',  'B3', 'E4'],
  E7:    ['E2', 'B2',  'D3', 'G#3', 'B3', 'E4'],
  Em7:   ['E2', 'B2',  'D3', 'G3',  'B3', 'E4'],
  F:     ['F2', 'C3',  'F3', 'A3',  'C4', 'F4'],
  G:     ['G2', 'B2',  'D3', 'G3',  'B3', 'G4'],
  G7:    ['G2', 'B2',  'D3', 'G3',  'B3', 'F4'],
};

export function voicingFor(chord: ChordName): string[] {
  const curated = CURATED_VOICINGS[chord];
  if (curated) return curated;
  const { root, suffix } = parseChordName(chord);
  return synthesizeVoicing(root, suffix);
}

export type StrumOpts = {
  staggerMs?: number;
  duration?: number;
  velocity?: number;
  startAt?: number;
};

// Schedule a chord on the given instrument. Default stagger is 22ms for guitar
// (audible strum) and 0 for piano (block chord). Returns the actual start time
// so callers can sequence successive chords (used by the progression mode).
export async function playChordOn(
  instrument: InstrumentName,
  notes: string[],
  opts: StrumOpts = {},
): Promise<number> {
  const defaultStagger = instrument === 'guitar' ? 22 : 0;
  const { staggerMs = defaultStagger, duration = 1.6, velocity = 90, startAt } = opts;
  const player = await loadInstrument(instrument);
  const ctx = getAudioContext();
  const t0 = startAt ?? ctx.currentTime + 0.05;
  const stagger = staggerMs / 1000;
  notes.forEach((note, i) => {
    player.start({ note, time: t0 + i * stagger, duration, velocity });
  });
  return t0;
}

// Backwards-compatible alias used by the existing guitar-chord exercise.
export function playStrum(notes: string[], opts: StrumOpts = {}): Promise<number> {
  return playChordOn('guitar', notes, opts);
}

// Roman numeral support for the progression mode. v1 supports C major.
export type Roman = 'I' | 'ii' | 'iii' | 'IV' | 'V' | 'vi' | 'vii°';
export type ProgKey = 'C';

const DIATONIC: Record<ProgKey, Record<Roman, ChordName>> = {
  C: {
    'I':    'C',
    'ii':   'Dm',
    'iii':  'Em',
    'IV':   'F',
    'V':    'G',
    'vi':   'Am',
    'vii°': 'Bdim',
  },
};

export function romanToChord(roman: Roman, key: ProgKey): ChordName {
  return DIATONIC[key][roman];
}

export function chordToRoman(chord: ChordName, key: ProgKey): Roman | null {
  const map = DIATONIC[key];
  for (const r of Object.keys(map) as Roman[]) {
    if (map[r] === chord) return r;
  }
  return null;
}

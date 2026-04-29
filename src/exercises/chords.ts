import { getAudioContext, loadInstrument } from '../audio/instrument';

export type ChordName =
  | 'A' | 'Am' | 'A7' | 'Am7'
  | 'Bdim'
  | 'C' | 'Cmaj7'
  | 'D' | 'Dm' | 'D7' | 'Dm7'
  | 'E' | 'Em' | 'E7' | 'Em7'
  | 'F'
  | 'G' | 'G7';

// Open-position voicings, low-to-high. Chosen to sound good on a
// general-MIDI acoustic-steel sample without realistic fingering.
export const CHORD_VOICINGS: Record<ChordName, string[]> = {
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

export type StrumOpts = {
  staggerMs?: number;
  duration?: number;
  velocity?: number;
  startAt?: number;
};

// Schedule a strum. Returns the actual start time so callers can sequence
// successive strums (used by progression mode).
export async function playStrum(
  notes: string[],
  opts: StrumOpts = {},
): Promise<number> {
  const { staggerMs = 22, duration = 1.6, velocity = 90, startAt } = opts;
  const guitar = await loadInstrument('guitar');
  const ctx = getAudioContext();
  const t0 = startAt ?? ctx.currentTime + 0.05;
  const stagger = staggerMs / 1000;
  notes.forEach((note, i) => {
    guitar.start({ note, time: t0 + i * stagger, duration, velocity });
  });
  return t0;
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

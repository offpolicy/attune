import type {
  GuitarChordKnobs,
  GuitarProgKnobs,
  Level,
  PianoNoteKnobs,
} from '../state/settings';
import type { Roman } from './chords';

export const LEVEL_NAMES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'warmup',
  2: 'session',
  3: 'gig',
  4: 'studio',
  5: 'mastering',
};

export const PIANO_LEVEL_PRESETS: Record<1 | 2 | 3 | 4 | 5, PianoNoteKnobs> = {
  1: { pool: 'tonic-triad',          range: [60, 72], labels: 'solfege' },
  2: { pool: 'diatonic',             range: [60, 72], labels: 'solfege' },
  3: { pool: 'diatonic',             range: [60, 72], labels: 'solfege' },
  4: { pool: 'diatonic+accidentals', range: [48, 72], labels: 'solfege' },
  5: { pool: 'chromatic',            range: [48, 72], labels: 'solfege' },
};

// Strictly cumulative across L1-L5: every chord at level N is also at N+1.
// Counts grow 4 → 8 → 13 → 17 → 22, layering triads → basic 7ths →
// diatonic 7ths + 9ths → dominant variations + altered colours.
export const GUITAR_CHORD_LEVEL_PRESETS: Record<
  1 | 2 | 3 | 4 | 5,
  GuitarChordKnobs
> = {
  // pop core: major/minor distinction on the iconic 4-chord loop
  1: {
    pool: ['C', 'F', 'G', 'Am'],
    voicing: 'fixed',
  },
  // all open-position triads (5 major + 3 minor)
  2: {
    pool: ['C', 'D', 'E', 'F', 'G', 'Am', 'Dm', 'Em'],
    voicing: 'fixed',
  },
  // + 6th open major (A) and the basic 7ths: dominant + maj7/m7 introduction
  3: {
    pool: [
      'C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em',
      'G7', 'D7',
      'Cmaj7', 'Am7',
    ],
    voicing: 'fixed',
  },
  // + finish the diatonic 7ths (Dm7, Em7) and start 9ths
  4: {
    pool: [
      'C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em',
      'G7', 'D7',
      'Cmaj7', 'Am7', 'Dm7', 'Em7',
      'Cmaj9', 'Am9',
    ],
    voicing: 'fixed',
  },
  // + dominant extensions (9, 13) and altered tensions (b9, #9), plus 6/9
  5: {
    pool: [
      'C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em',
      'G7', 'D7',
      'Cmaj7', 'Am7', 'Dm7', 'Em7',
      'Cmaj9', 'Am9',
      'G9', 'G13', 'G7b9', 'G7#9', 'C6/9',
    ],
    voicing: 'fixed',
  },
};

// L1-L5 layer three axes per the docs/progression-algorithm.md design:
//   - Roman pool (which functions are in play)
//   - qualityScheme (how each Roman is voiced)
//   - form (length, tempo, and template variety via minLevel gating)
// Templates self-gate by minLevel, so the Roman pool can stay diatonic
// at L4-L5 while the harmonic colour does the lifting.
const ALL_DIATONIC: Roman[] = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

export const GUITAR_PROG_LEVEL_PRESETS: Record<
  1 | 2 | 3 | 4 | 5,
  GuitarProgKnobs
> = {
  1: { key: 'C', length: 3, pool: ['I', 'IV', 'V'],            tempo: 'slow',   qualityScheme: 'triads',         showRoman: false },
  2: { key: 'C', length: 4, pool: ['I', 'ii', 'IV', 'V', 'vi'], tempo: 'slow',   qualityScheme: 'triads+V7',      showRoman: false },
  3: { key: 'C', length: 4, pool: ALL_DIATONIC,                 tempo: 'medium', qualityScheme: 'diatonic-7ths',  showRoman: false },
  4: { key: 'C', length: 4, pool: ALL_DIATONIC,                 tempo: 'medium', qualityScheme: 'extensions',     showRoman: false },
  5: { key: 'C', length: 4, pool: ALL_DIATONIC,                 tempo: 'fast',   qualityScheme: 'altered',        showRoman: false },
};

export function levelLabel(level: Level): string {
  return level === 'custom' ? 'custom' : LEVEL_NAMES[level];
}

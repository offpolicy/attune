import type {
  GuitarChordKnobs,
  GuitarProgKnobs,
  Level,
  PianoNoteKnobs,
} from '../state/settings';

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

export const GUITAR_CHORD_LEVEL_PRESETS: Record<
  1 | 2 | 3 | 4 | 5,
  GuitarChordKnobs
> = {
  1: { pool: ['C', 'Am', 'F', 'G'], voicing: 'fixed' },
  2: { pool: ['C', 'Am', 'F', 'G', 'D', 'E'], voicing: 'fixed' },
  3: { pool: ['C', 'Am', 'F', 'G', 'D', 'E', 'Dm', 'Em', 'A'], voicing: 'fixed' },
  4: {
    pool: ['C', 'Am', 'F', 'G', 'D', 'E', 'Dm', 'Em', 'A', 'G7', 'D7', 'A7', 'E7'],
    voicing: 'fixed',
  },
  5: {
    pool: [
      'C', 'Am', 'F', 'G', 'D', 'E', 'Dm', 'Em', 'A',
      'G7', 'D7', 'A7', 'E7',
      'Cmaj7', 'Am7', 'Em7', 'Dm7',
    ],
    voicing: 'fixed',
  },
};

export const GUITAR_PROG_LEVEL_PRESETS: Record<
  1 | 2 | 3 | 4 | 5,
  GuitarProgKnobs
> = {
  1: { key: 'C', length: 3, pool: ['I', 'IV', 'V'],                                  tempo: 'slow',   showRoman: false },
  2: { key: 'C', length: 3, pool: ['I', 'IV', 'V', 'vi'],                            tempo: 'slow',   showRoman: false },
  3: { key: 'C', length: 3, pool: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],       tempo: 'medium', showRoman: false },
  4: { key: 'C', length: 4, pool: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],       tempo: 'medium', showRoman: false },
  5: { key: 'C', length: 4, pool: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],       tempo: 'fast',   showRoman: false },
};

export function levelLabel(level: Level): string {
  return level === 'custom' ? 'custom' : LEVEL_NAMES[level];
}

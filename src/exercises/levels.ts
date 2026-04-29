import type { Level, PianoNoteKnobs } from '../state/settings';

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

export function levelLabel(level: Level): string {
  return level === 'custom' ? 'custom' : LEVEL_NAMES[level];
}

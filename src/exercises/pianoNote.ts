import { getAudioContext, loadInstrument, unlockAudio } from '../audio/instrument';
import { midiToNote, type Midi } from '../audio/theory';
import type { PianoNoteKnobs } from '../state/settings';

export type DegreeOption = {
  label: string;
  semitones: number;
};

const DIATONIC_SOLFEGE: DegreeOption[] = [
  { label: 'do',  semitones: 0 },
  { label: 're',  semitones: 2 },
  { label: 'mi',  semitones: 4 },
  { label: 'fa',  semitones: 5 },
  { label: 'sol', semitones: 7 },
  { label: 'la',  semitones: 9 },
  { label: 'ti',  semitones: 11 },
];

const TRIAD_SOLFEGE: DegreeOption[] = [
  DIATONIC_SOLFEGE[0]!,
  DIATONIC_SOLFEGE[2]!,
  DIATONIC_SOLFEGE[4]!,
];

const CHROMATIC_SOLFEGE: DegreeOption[] = [
  { label: 'do',  semitones: 0 },
  { label: 'di',  semitones: 1 },
  { label: 're',  semitones: 2 },
  { label: 'ri',  semitones: 3 },
  { label: 'mi',  semitones: 4 },
  { label: 'fa',  semitones: 5 },
  { label: 'fi',  semitones: 6 },
  { label: 'sol', semitones: 7 },
  { label: 'si',  semitones: 8 },
  { label: 'la',  semitones: 9 },
  { label: 'li',  semitones: 10 },
  { label: 'ti',  semitones: 11 },
];

const DIATONIC_NUMERIC: DegreeOption[] = [
  { label: '1', semitones: 0 },
  { label: '2', semitones: 2 },
  { label: '3', semitones: 4 },
  { label: '4', semitones: 5 },
  { label: '5', semitones: 7 },
  { label: '6', semitones: 9 },
  { label: '7', semitones: 11 },
];

const TRIAD_NUMERIC: DegreeOption[] = [
  DIATONIC_NUMERIC[0]!,
  DIATONIC_NUMERIC[2]!,
  DIATONIC_NUMERIC[4]!,
];

const CHROMATIC_NUMERIC: DegreeOption[] = [
  { label: '1',  semitones: 0 },
  { label: 'b2', semitones: 1 },
  { label: '2',  semitones: 2 },
  { label: 'b3', semitones: 3 },
  { label: '3',  semitones: 4 },
  { label: '4',  semitones: 5 },
  { label: '#4', semitones: 6 },
  { label: '5',  semitones: 7 },
  { label: 'b6', semitones: 8 },
  { label: '6',  semitones: 9 },
  { label: 'b7', semitones: 10 },
  { label: '7',  semitones: 11 },
];

export function poolDegrees(knobs: PianoNoteKnobs): DegreeOption[] {
  const { pool, labels } = knobs;
  if (labels === 'numeric') {
    switch (pool) {
      case 'tonic-triad':          return TRIAD_NUMERIC;
      case 'diatonic':             return DIATONIC_NUMERIC;
      case 'diatonic+accidentals': return CHROMATIC_NUMERIC;
      case 'chromatic':            return CHROMATIC_NUMERIC;
    }
  }
  switch (pool) {
    case 'tonic-triad':          return TRIAD_SOLFEGE;
    case 'diatonic':             return DIATONIC_SOLFEGE;
    case 'diatonic+accidentals': return CHROMATIC_SOLFEGE;
    case 'chromatic':            return CHROMATIC_SOLFEGE;
  }
}

export type PianoNoteQuestion = {
  tonicMidi: Midi;
  targetMidi: Midi;
  degreeLabel: string;
};

export type PianoNoteAnswer = number; // semitones from tonic, 0–11

const SOLFEGE_LABELS = [
  'do', 'di', 're', 'ri', 'mi', 'fa',
  'fi', 'sol', 'si', 'la', 'li', 'ti',
] as const;

const NUMERIC_LABELS = [
  '1', 'b2', '2', 'b3', '3', '4',
  '#4', '5', 'b6', '6', 'b7', '7',
] as const;

export function makeLabelFor(
  scheme: 'solfege' | 'numeric',
): (semitones: number) => string {
  const arr = scheme === 'solfege' ? SOLFEGE_LABELS : NUMERIC_LABELS;
  return (s) => arr[s] ?? '';
}

export function generatePianoNoteQuestion(
  knobs: PianoNoteKnobs,
): PianoNoteQuestion {
  const pool = poolDegrees(knobs);
  const degree = pool[Math.floor(Math.random() * pool.length)]!;
  const tonicMidi = knobs.range[0];
  const targetMidi = tonicMidi + degree.semitones;
  return { tonicMidi, targetMidi, degreeLabel: degree.label };
}

export async function playPianoTarget(q: PianoNoteQuestion): Promise<void> {
  await unlockAudio();
  const piano = await loadInstrument('piano');
  const ctx = getAudioContext();
  piano.start({
    note: midiToNote(q.targetMidi),
    time: ctx.currentTime + 0.05,
    duration: 1.4,
    velocity: 90,
  });
}

export async function playPianoTonic(q: PianoNoteQuestion): Promise<void> {
  await unlockAudio();
  const piano = await loadInstrument('piano');
  const ctx = getAudioContext();
  piano.start({
    note: midiToNote(q.tonicMidi),
    time: ctx.currentTime + 0.05,
    duration: 1.0,
    velocity: 80,
  });
}

export function isCorrectPianoNote(q: PianoNoteQuestion, a: PianoNoteAnswer): boolean {
  const targetSemitones = ((q.targetMidi - q.tonicMidi) % 12 + 12) % 12;
  return targetSemitones === a;
}

export function describePianoNote(q: PianoNoteQuestion): string {
  return q.degreeLabel;
}

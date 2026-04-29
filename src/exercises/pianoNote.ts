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
  playReference: boolean;
};

export type PianoNoteAnswer = string;

export function generatePianoNoteQuestion(
  knobs: PianoNoteKnobs,
  isFirstOfSession: boolean,
): PianoNoteQuestion {
  const pool = poolDegrees(knobs);
  const degree = pool[Math.floor(Math.random() * pool.length)]!;
  const tonicMidi = knobs.range[0];
  const targetMidi = tonicMidi + degree.semitones;

  let playReference: boolean;
  switch (knobs.reference) {
    case 'every': playReference = true; break;
    case 'first': playReference = isFirstOfSession; break;
    case 'never': playReference = false; break;
  }

  return { tonicMidi, targetMidi, degreeLabel: degree.label, playReference };
}

export async function playPianoNoteQuestion(q: PianoNoteQuestion): Promise<void> {
  await unlockAudio();
  const piano = await loadInstrument('piano');
  const ctx = getAudioContext();
  const t0 = ctx.currentTime + 0.05;

  if (q.playReference) {
    piano.start({ note: midiToNote(q.tonicMidi), time: t0,       duration: 0.9, velocity: 80 });
    piano.start({ note: midiToNote(q.targetMidi), time: t0 + 1.2, duration: 1.4, velocity: 90 });
  } else {
    piano.start({ note: midiToNote(q.targetMidi), time: t0,       duration: 1.4, velocity: 90 });
  }
}

export function isCorrectPianoNote(q: PianoNoteQuestion, a: PianoNoteAnswer): boolean {
  return q.degreeLabel === a;
}

export function describePianoNote(q: PianoNoteQuestion): string {
  return q.degreeLabel;
}

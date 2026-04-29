import {
  unlockAudio,
  loadInstrument,
  type InstrumentName,
} from '../audio/instrument';
import {
  parseChordName,
  synthesizeVoicing,
} from './chordLibrary';
import { voicingFor, playChordOn, type ChordName } from './chords';
import type { GuitarChordKnobs } from '../state/settings';

export type GuitarChordQuestion = {
  chord: ChordName;
};

export type GuitarChordAnswer = ChordName;

export function generateChordQuestion(
  knobs: GuitarChordKnobs,
): GuitarChordQuestion {
  const pool = knobs.pool;
  const chord = pool[Math.floor(Math.random() * pool.length)]!;
  return { chord };
}

// Curated guitar voicings put root notes in the open-position octave (E2-E3)
// that's natural on the fretboard but boomy on a grand piano. For piano we
// always use the synthesized voicing, which puts the chord in C3-C5 territory.
function voicingForInstrument(
  instrument: InstrumentName,
  chord: ChordName,
): string[] {
  if (instrument === 'guitar') return voicingFor(chord);
  const { root, suffix } = parseChordName(chord);
  return synthesizeVoicing(root, suffix);
}

export async function playChord(
  instrument: InstrumentName,
  q: GuitarChordQuestion,
): Promise<void> {
  await unlockAudio();
  await loadInstrument(instrument);
  await playChordOn(instrument, voicingForInstrument(instrument, q.chord));
}

export function isCorrectChord(
  q: GuitarChordQuestion,
  a: GuitarChordAnswer,
): boolean {
  return q.chord === a;
}

export function describeChord(q: GuitarChordQuestion): string {
  return q.chord;
}

// Backwards-compat aliases for callers not yet migrated.
export const generateGuitarChordQuestion = generateChordQuestion;
export const isCorrectGuitarChord = isCorrectChord;
export const describeGuitarChord = describeChord;
export const playGuitarChord = (q: GuitarChordQuestion) => playChord('guitar', q);

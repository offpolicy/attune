import { unlockAudio, loadInstrument } from '../audio/instrument';
import { voicingFor, playStrum, type ChordName } from './chords';
import type { GuitarChordKnobs } from '../state/settings';

export type GuitarChordQuestion = {
  chord: ChordName;
};

export type GuitarChordAnswer = ChordName;

export function generateGuitarChordQuestion(
  knobs: GuitarChordKnobs,
): GuitarChordQuestion {
  const pool = knobs.pool;
  const chord = pool[Math.floor(Math.random() * pool.length)]!;
  return { chord };
}

export async function playGuitarChord(q: GuitarChordQuestion): Promise<void> {
  await unlockAudio();
  await loadInstrument('guitar');
  await playStrum(voicingFor(q.chord));
}

export function isCorrectGuitarChord(
  q: GuitarChordQuestion,
  a: GuitarChordAnswer,
): boolean {
  return q.chord === a;
}

export function describeGuitarChord(q: GuitarChordQuestion): string {
  return q.chord;
}

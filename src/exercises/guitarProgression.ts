import { unlockAudio, loadInstrument, getAudioContext } from '../audio/instrument';
import {
  CHORD_VOICINGS,
  romanToChord,
  type ChordName,
  type ProgKey,
  type Roman,
} from './chords';
import type { GuitarProgKnobs } from '../state/settings';

export type GuitarProgQuestion = {
  key: ProgKey;
  progression: ChordName[];
  poolChords: ChordName[]; // chord names matching the active Roman pool
};

export type GuitarProgAnswer = (ChordName | null)[];

const STRIDE_BY_TEMPO: Record<'slow' | 'medium' | 'fast', number> = {
  slow:   1.4,
  medium: 0.95,
  fast:   0.65,
};

export function generateGuitarProgQuestion(
  knobs: GuitarProgKnobs,
): GuitarProgQuestion {
  const key = knobs.key as ProgKey;
  const pool = knobs.pool as Roman[];
  const length = knobs.length;

  const poolChords = pool.map((r) => romanToChord(r, key));

  // Always start on the tonic (I).
  const progression: ChordName[] = [romanToChord('I', key)];
  while (progression.length < length) {
    const last = progression[progression.length - 1]!;
    const candidates = poolChords.filter((c) => c !== last);
    const fallback = poolChords[0]!;
    const next =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]!
        : fallback;
    progression.push(next);
  }

  return { key, progression, poolChords };
}

export async function playGuitarProgQuestion(
  q: GuitarProgQuestion,
  tempo: 'slow' | 'medium' | 'fast',
): Promise<void> {
  await unlockAudio();
  await loadInstrument('guitar');
  const stride = STRIDE_BY_TEMPO[tempo];
  const ctx = getAudioContext();
  let t = ctx.currentTime + 0.05;
  for (const chord of q.progression) {
    await playStrumScheduled(chord, t, stride * 1.3);
    t += stride;
  }
}

async function playStrumScheduled(
  chord: ChordName,
  startAt: number,
  duration: number,
): Promise<void> {
  const notes = CHORD_VOICINGS[chord];
  const guitar = await loadInstrument('guitar');
  notes.forEach((note, i) => {
    guitar.start({ note, time: startAt + i * 0.022, duration, velocity: 90 });
  });
}

export function perSlotFeedback(
  q: GuitarProgQuestion,
  a: GuitarProgAnswer,
): boolean[] {
  return q.progression.map((c, i) => a[i] === c);
}

export function isCorrectProgression(
  q: GuitarProgQuestion,
  a: GuitarProgAnswer,
): boolean {
  if (a.length !== q.progression.length) return false;
  return perSlotFeedback(q, a).every(Boolean);
}

export function describeProgression(q: GuitarProgQuestion): string {
  return q.progression.join(' → ');
}

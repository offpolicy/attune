import { unlockAudio, loadInstrument, getAudioContext } from '../audio/instrument';
import {
  voicingFor,
  type ChordName,
  type ProgKey,
  type Roman,
} from './chords';
import type { GuitarProgKnobs, Level } from '../state/settings';
import {
  eligibleTemplates,
  fillTemplate,
  poolChordsFor,
  romansToChords,
  type QualityScheme,
} from './progressionTemplates';

export type GuitarProgQuestion = {
  key: ProgKey;
  progression: ChordName[];
  poolChords: ChordName[]; // chord names matching the active Roman pool
  templateName?: string;   // debug only; not displayed
};

export type GuitarProgAnswer = (ChordName | null)[];

const STRIDE_BY_TEMPO: Record<'slow' | 'medium' | 'fast', number> = {
  slow:   1.4,
  medium: 0.95,
  fast:   0.65,
};

// Treat the 'custom' level as the most permissive template tier so users who
// fine-tune still get the full cadence library against their chosen pool.
function resolveLevel(level: Level): 1 | 2 | 3 | 4 | 5 {
  return level === 'custom' ? 5 : level;
}

// Existing settings persisted before qualityScheme existed will be missing
// the field; default to 'triads' so the L1 vocabulary still applies.
function resolveScheme(scheme: QualityScheme | undefined): QualityScheme {
  return scheme ?? 'triads';
}

export function generateGuitarProgQuestion(
  knobs: GuitarProgKnobs,
  level: Level,
): GuitarProgQuestion {
  const key = knobs.key as ProgKey;
  const pool = knobs.pool as Roman[];
  const length = knobs.length;
  const scheme = resolveScheme(knobs.qualityScheme);
  const poolChords = poolChordsFor(pool, scheme);

  const eligible = eligibleTemplates(pool, length, resolveLevel(level));
  if (eligible.length > 0) {
    const template = eligible[Math.floor(Math.random() * eligible.length)]!;
    const romans = fillTemplate(template, pool);
    return {
      key,
      progression: romansToChords(romans, scheme),
      poolChords,
      templateName: template.name,
    };
  }

  return legacyRandomGenerate(length, scheme, key, pool, poolChords);
}

// Uniform-random fallback for unusual pools (e.g., no D-function chord)
// or unsupported lengths. Anchors on I, avoids immediate Roman repetition,
// and still routes through the active scheme so the colour layer stays
// consistent with the level preset.
function legacyRandomGenerate(
  length: number,
  scheme: QualityScheme,
  key: ProgKey,
  pool: Roman[],
  poolChords: ChordName[],
): GuitarProgQuestion {
  const romans: Roman[] = ['I'];
  while (romans.length < length) {
    const last = romans[romans.length - 1]!;
    const candidates = pool.filter((r) => r !== last);
    const fallback = pool[0]!;
    const next =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]!
        : fallback;
    romans.push(next);
  }
  return {
    key,
    progression: romansToChords(romans, scheme),
    poolChords,
    templateName: 'legacy-random',
  };
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
  const notes = voicingFor(chord);
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

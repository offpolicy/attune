import {
  unlockAudio,
  loadInstrument,
  getAudioContext,
} from '../audio/instrument';
import { midiToNote } from '../audio/theory';
import {
  bassOctaveRootMidi,
  parseChordName,
  synthesizeVoicing,
} from './chordLibrary';
import {
  type ChordName,
  type ProgKey,
  type Roman,
  type Root,
} from './chords';
import type { GuitarProgKnobs, Level } from '../state/settings';
import {
  eligibleTemplates,
  fillTemplate,
  poolChordsFor,
  romansToChords,
  type QualityScheme,
} from './progressionTemplates';

// A bassline question shares its skeleton with a chord-progression question
// (templates, length, key, quality scheme). The audio is a duet — piano plays
// the chord, bass plucks the root in the bass octave underneath. The user's
// task is to identify the *root motion*, not the chord qualities.
export type BasslineQuestion = {
  key:        ProgKey;
  progression: ChordName[]; // for audio rendering
  roots:      Root[];       // the correct answer sequence
  poolRoots:  Root[];       // chip pool — all unique roots reachable from the active Roman pool
  templateName?: string;    // debug only
};

export type BasslineAnswer = (Root | null)[];

const STRIDE_BY_TEMPO: Record<'slow' | 'medium' | 'fast', number> = {
  slow:   1.4,
  medium: 0.95,
  fast:   0.65,
};

function resolveLevel(level: Level): 1 | 2 | 3 | 4 | 5 {
  return level === 'custom' ? 5 : level;
}

function resolveScheme(scheme: QualityScheme | undefined): QualityScheme {
  return scheme ?? 'triads';
}

function uniqueRoots(chords: ChordName[]): Root[] {
  const seen = new Set<Root>();
  const out: Root[] = [];
  for (const c of chords) {
    const { root } = parseChordName(c);
    if (!seen.has(root)) {
      seen.add(root);
      out.push(root);
    }
  }
  return out;
}

export function generateBasslineQuestion(
  knobs: GuitarProgKnobs,
  level: Level,
): BasslineQuestion {
  const key = knobs.key as ProgKey;
  const pool = knobs.pool as Roman[];
  const length = knobs.length;
  const scheme = resolveScheme(knobs.qualityScheme);
  const allPoolChords = poolChordsFor(pool, scheme);
  const poolRoots = uniqueRoots(allPoolChords);

  const eligible = eligibleTemplates(pool, length, resolveLevel(level));
  const fill = (): { progression: ChordName[]; templateName: string } => {
    if (eligible.length > 0) {
      const template = eligible[Math.floor(Math.random() * eligible.length)]!;
      const romans = fillTemplate(template, pool);
      return {
        progression: romansToChords(romans, scheme),
        templateName: template.name,
      };
    }
    return legacyRandomProgression(length, scheme, pool);
  };

  const { progression, templateName } = fill();
  const roots = progression.map((c) => parseChordName(c).root);
  return { key, progression, roots, poolRoots, templateName };
}

function legacyRandomProgression(
  length: number,
  scheme: QualityScheme,
  pool: Roman[],
): { progression: ChordName[]; templateName: string } {
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
    progression: romansToChords(romans, scheme),
    templateName: 'legacy-random',
  };
}

// Audio: piano plays the chord (block voicing, mid-octave), bass doubles the
// root one octave below. Both start at the same time so the listener hears
// the harmony with the bass note popping out underneath.
export async function playBasslineQuestion(
  q: BasslineQuestion,
  tempo: 'slow' | 'medium' | 'fast',
): Promise<void> {
  await unlockAudio();
  const piano = await loadInstrument('piano');
  const bass = await loadInstrument('bass');
  const stride = STRIDE_BY_TEMPO[tempo];
  const ctx = getAudioContext();
  let t = ctx.currentTime + 0.05;
  for (let i = 0; i < q.progression.length; i++) {
    const chord = q.progression[i]!;
    const root = q.roots[i]!;
    const { suffix } = parseChordName(chord);
    const chordNotes = synthesizeVoicing(root, suffix);

    // Piano: block chord, slightly lower velocity so the bass note reads.
    chordNotes.forEach((note) => {
      piano.start({ note, time: t, duration: stride * 1.3, velocity: 70 });
    });

    // Bass: root one octave below the chord's root.
    bass.start({
      note: midiToNote(bassOctaveRootMidi(root)),
      time: t,
      duration: stride * 1.3,
      velocity: 110,
    });

    t += stride;
  }
}

export function perSlotFeedback(
  q: BasslineQuestion,
  a: BasslineAnswer,
): boolean[] {
  return q.roots.map((r, i) => a[i] === r);
}

export function isCorrectBassline(
  q: BasslineQuestion,
  a: BasslineAnswer,
): boolean {
  if (a.length !== q.roots.length) return false;
  return perSlotFeedback(q, a).every(Boolean);
}

export function describeBassline(q: BasslineQuestion): string {
  return q.roots.join(' → ');
}

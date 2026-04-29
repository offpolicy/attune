import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../../state/settings';
import { useStats } from '../../state/stats';
import { Button } from '../../components/Button';
import { FeedbackLine } from '../../components/FeedbackLine';
import { loadInstrument } from '../../audio/instrument';
import {
  generateChordQuestion,
  playChord,
  isCorrectChord,
  describeChord,
  type GuitarChordQuestion,
} from '../../exercises/guitarChord';
import type { ChordName } from '../../exercises/chords';
import { GuitarChordAnswers } from './GuitarChordAnswers';
import { ExerciseHeader, ExerciseFooter } from './ExerciseChrome';
import { splitMode, type Mode } from '../../types';

type Phase = 'idle' | 'played' | 'answered';

type State = {
  phase: Phase;
  question: GuitarChordQuestion;
  userAnswer?: ChordName;
  correct?: boolean;
};

const SETTINGS_KEY = {
  'piano-chord':  'pianoChord',
  'guitar-chord': 'guitarChord',
} as const;

const TITLE: Record<'piano-chord' | 'guitar-chord', string> = {
  'piano-chord':  'piano · single chord',
  'guitar-chord': 'guitar · single chord',
};

type SingleChordMode = 'piano-chord' | 'guitar-chord';

function isSingleChordMode(m: Mode): m is SingleChordMode {
  return m === 'piano-chord' || m === 'guitar-chord';
}

export function GuitarChordExercise({
  mode = 'guitar-chord' as Mode,
}: { mode?: Mode } = {}) {
  if (!isSingleChordMode(mode)) throw new Error(`GuitarChordExercise got non-chord mode: ${mode}`);
  const { instrument } = splitMode(mode);
  const settingsKey = SETTINGS_KEY[mode];

  const { settings } = useSettings();
  const { stats, recordTakeFor } = useStats();
  const knobs = settings[settingsKey].knobs;
  const level = settings[settingsKey].level;

  const [takeNumber, setTakeNumber] = useState(1);
  const [s, setS] = useState<State>(() => ({
    phase: 'idle',
    question: generateChordQuestion(knobs),
  }));
  const [busy, setBusy] = useState(false);

  useEffect(() => { void loadInstrument(instrument); }, [instrument]);

  const play = useCallback(async () => {
    setBusy(true);
    try { await playChord(instrument, s.question); }
    finally {
      setBusy(false);
      setS((cur) => (cur.phase === 'idle' ? { ...cur, phase: 'played' } : cur));
    }
  }, [s.question, instrument]);

  const submit = useCallback((chord: ChordName) => {
    if (s.phase !== 'played') return;
    const correct = isCorrectChord(s.question, chord);
    recordTakeFor(mode, correct);
    setS((cur) => ({ ...cur, phase: 'answered', userAnswer: chord, correct }));
  }, [s.phase, s.question, recordTakeFor, mode]);

  const next = useCallback(() => {
    setTakeNumber((n) => n + 1);
    setS({ phase: 'idle', question: generateChordQuestion(knobs) });
  }, [knobs]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (s.phase !== 'answered') void play();
        return;
      }
      if (e.key === 'Enter' && s.phase === 'answered') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [s.phase, play, next]);

  return (
    <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
      <ExerciseHeader title={TITLE[mode]} level={level} instrument={instrument} />

      <section className="flex flex-col items-center gap-4 py-4">
        <Button onClick={play} disabled={busy || s.phase === 'answered'}>
          ▶ {s.phase === 'idle' ? 'play' : 'replay'}
        </Button>

        <div className="h-12 flex items-center">
          {s.phase !== 'idle' && (
            <Button variant="secondary" onClick={play} disabled={busy}>
              ↻ loop
            </Button>
          )}
        </div>

        <div className="my-8 w-full">
          <GuitarChordAnswers
            pool={knobs.pool}
            disabled={s.phase !== 'played'}
            picked={s.userAnswer}
            onPick={submit}
          />
        </div>

        <FeedbackLine
          state={s.phase === 'answered' ? (s.correct ? 'correct' : 'wrong') : 'idle'}
          answer={s.phase === 'answered' ? describeChord(s.question) : undefined}
        />

        <div className="h-12 flex items-center">
          {s.phase === 'answered' && (
            <Button variant="secondary" onClick={next}>
              next take →
            </Button>
          )}
        </div>
      </section>

      <ExerciseFooter takeNumber={takeNumber} modeStats={stats[mode]} />
    </main>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../../state/settings';
import { useStats } from '../../state/stats';
import { Button } from '../../components/Button';
import { FeedbackLine } from '../../components/FeedbackLine';
import { loadInstrument } from '../../audio/instrument';
import {
  generateGuitarChordQuestion,
  playGuitarChord,
  isCorrectGuitarChord,
  describeGuitarChord,
  type GuitarChordQuestion,
} from '../../exercises/guitarChord';
import type { ChordName } from '../../exercises/chords';
import { GuitarChordAnswers } from './GuitarChordAnswers';
import { ExerciseHeader, ExerciseFooter } from './ExerciseChrome';

type Phase = 'idle' | 'played' | 'answered';

type State = {
  phase: Phase;
  question: GuitarChordQuestion;
  userAnswer?: ChordName;
  correct?: boolean;
};

export function GuitarChordExercise() {
  const { settings } = useSettings();
  const { stats, recordTakeFor } = useStats();
  const knobs = settings.guitarChord.knobs;
  const level = settings.guitarChord.level;

  const [takeNumber, setTakeNumber] = useState(1);
  const [s, setS] = useState<State>(() => ({
    phase: 'idle',
    question: generateGuitarChordQuestion(knobs),
  }));
  const [busy, setBusy] = useState(false);

  useEffect(() => { void loadInstrument('guitar'); }, []);

  const play = useCallback(async () => {
    setBusy(true);
    try { await playGuitarChord(s.question); }
    finally {
      setBusy(false);
      setS((cur) => (cur.phase === 'idle' ? { ...cur, phase: 'played' } : cur));
    }
  }, [s.question]);

  const submit = useCallback((chord: ChordName) => {
    if (s.phase !== 'played') return;
    const correct = isCorrectGuitarChord(s.question, chord);
    recordTakeFor('guitar-chord', correct);
    setS((cur) => ({ ...cur, phase: 'answered', userAnswer: chord, correct }));
  }, [s.phase, s.question, recordTakeFor]);

  const next = useCallback(() => {
    setTakeNumber((n) => n + 1);
    setS({ phase: 'idle', question: generateGuitarChordQuestion(knobs) });
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
      <ExerciseHeader title="guitar · single chord" level={level} instrument="guitar" />

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
          answer={s.phase === 'answered' ? describeGuitarChord(s.question) : undefined}
        />

        <div className="h-12 flex items-center">
          {s.phase === 'answered' && (
            <Button variant="secondary" onClick={next}>
              next take →
            </Button>
          )}
        </div>
      </section>

      <ExerciseFooter takeNumber={takeNumber} modeStats={stats['guitar-chord']} />
    </main>
  );
}

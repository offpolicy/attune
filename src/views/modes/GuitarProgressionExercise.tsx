import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../../state/settings';
import { useStats } from '../../state/stats';
import { Button } from '../../components/Button';
import { FeedbackLine } from '../../components/FeedbackLine';
import { loadInstrument } from '../../audio/instrument';
import {
  generateGuitarProgQuestion,
  playGuitarProgQuestion,
  isCorrectProgression,
  describeProgression,
  perSlotFeedback,
  type GuitarProgQuestion,
} from '../../exercises/guitarProgression';
import type { ChordName } from '../../exercises/chords';
import { GuitarProgressionAnswers } from './GuitarProgressionAnswers';
import { ExerciseHeader, ExerciseFooter } from './ExerciseChrome';

type Phase = 'idle' | 'played' | 'filling' | 'answered';

type State = {
  phase: Phase;
  question: GuitarProgQuestion;
  slots: (ChordName | null)[];
  correct?: boolean;
  feedback?: boolean[];
};

export function GuitarProgressionExercise() {
  const { settings } = useSettings();
  const { stats, recordTakeFor } = useStats();
  const knobs = settings.guitarProg.knobs;
  const level = settings.guitarProg.level;

  const [takeNumber, setTakeNumber] = useState(1);
  const [s, setS] = useState<State>(() => {
    const q = generateGuitarProgQuestion(knobs, level);
    return {
      phase: 'idle',
      question: q,
      slots: Array.from({ length: q.progression.length }, () => null),
    };
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { void loadInstrument('guitar'); }, []);

  const play = useCallback(async () => {
    setBusy(true);
    try { await playGuitarProgQuestion(s.question, knobs.tempo); }
    finally {
      setBusy(false);
      setS((cur) =>
        cur.phase === 'idle' ? { ...cur, phase: 'played' } : cur,
      );
    }
  }, [s.question, knobs.tempo]);

  const pickChord = useCallback((chord: ChordName) => {
    setS((cur) => {
      if (cur.phase !== 'played' && cur.phase !== 'filling') return cur;
      const idx = cur.slots.findIndex((v) => v == null);
      if (idx === -1) return cur;
      const slots = [...cur.slots];
      slots[idx] = chord;
      const allFilled = slots.every((v) => v != null);
      return { ...cur, slots, phase: allFilled ? 'filling' : 'filling' };
    });
  }, []);

  const clearSlot = useCallback((idx: number) => {
    setS((cur) => {
      if (cur.phase === 'answered') return cur;
      const slots = [...cur.slots];
      slots[idx] = null;
      return { ...cur, slots, phase: 'filling' };
    });
  }, []);

  const submit = useCallback(() => {
    setS((cur) => {
      if (cur.slots.some((v) => v == null)) return cur;
      const answer = cur.slots as ChordName[];
      const correct = isCorrectProgression(cur.question, answer);
      const fb = perSlotFeedback(cur.question, answer);
      recordTakeFor('guitar-prog', correct);
      return { ...cur, phase: 'answered', correct, feedback: fb };
    });
  }, [recordTakeFor]);

  const next = useCallback(() => {
    const q = generateGuitarProgQuestion(knobs, level);
    setTakeNumber((n) => n + 1);
    setS({
      phase: 'idle',
      question: q,
      slots: Array.from({ length: q.progression.length }, () => null),
    });
  }, [knobs, level]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (s.phase !== 'answered') void play();
        return;
      }
      if (e.key === 'Enter') {
        if (s.phase === 'answered') {
          e.preventDefault();
          next();
        } else if (s.phase === 'filling' && s.slots.every((v) => v != null)) {
          e.preventDefault();
          submit();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [s.phase, s.slots, play, submit, next]);

  const allFilled = s.slots.every((v) => v != null);

  return (
    <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
      <ExerciseHeader title="guitar · chord progression" level={level} instrument="guitar" />

      <section className="flex flex-col items-center gap-4 py-4">
        <p className="font-sans text-xs uppercase tracking-[0.18em] text-paper-muted">
          key of {knobs.key} · {knobs.length} chords
        </p>

        <Button onClick={play} disabled={busy || s.phase === 'answered'}>
          ▶ {s.phase === 'idle' ? 'play' : 'replay'}
        </Button>

        <div className="h-12 flex items-center">
          {s.phase !== 'idle' && s.phase !== 'answered' && (
            <Button variant="secondary" onClick={play} disabled={busy}>
              ↻ loop
            </Button>
          )}
        </div>

        <div className="my-8 w-full">
          <GuitarProgressionAnswers
            pool={s.question.poolChords}
            length={knobs.length}
            disabled={s.phase === 'idle'}
            slots={s.slots}
            feedback={s.phase === 'answered' ? s.feedback : undefined}
            onPickChord={pickChord}
            onClearSlot={clearSlot}
          />
        </div>

        <div className="h-12 flex items-center">
          {s.phase !== 'answered' && s.phase !== 'idle' && (
            <Button onClick={submit} disabled={!allFilled}>
              submit
            </Button>
          )}
        </div>

        <FeedbackLine
          state={s.phase === 'answered' ? (s.correct ? 'correct' : 'wrong') : 'idle'}
          answer={s.phase === 'answered' ? describeProgression(s.question) : undefined}
        />

        <div className="h-12 flex items-center">
          {s.phase === 'answered' && (
            <Button variant="secondary" onClick={next}>
              next take →
            </Button>
          )}
        </div>
      </section>

      <ExerciseFooter takeNumber={takeNumber} modeStats={stats['guitar-prog']} />
    </main>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../../state/settings';
import { useStats } from '../../state/stats';
import { Button } from '../../components/Button';
import { FeedbackLine } from '../../components/FeedbackLine';
import { loadInstrument } from '../../audio/instrument';
import {
  generateBasslineQuestion,
  playBasslineQuestion,
  isCorrectBassline,
  describeBassline,
  perSlotFeedback,
  type BasslineQuestion,
} from '../../exercises/bassline';
import type { Root } from '../../exercises/chords';
import { BasslineAnswers } from './BasslineAnswers';
import { ExerciseHeader, ExerciseFooter } from './ExerciseChrome';

type Phase = 'idle' | 'played' | 'filling' | 'answered';

type State = {
  phase: Phase;
  question: BasslineQuestion;
  slots: (Root | null)[];
  correct?: boolean;
  feedback?: boolean[];
};

// Bassline mode is bass-only; the only valid Mode here is 'bass-roots'.
export function BasslineExercise() {
  const { settings } = useSettings();
  const { stats, recordTakeFor } = useStats();
  const knobs = settings.bassRoots.knobs;
  const level = settings.bassRoots.level;

  const [takeNumber, setTakeNumber] = useState(1);
  const [s, setS] = useState<State>(() => {
    const q = generateBasslineQuestion(knobs, level);
    return {
      phase: 'idle',
      question: q,
      slots: Array.from({ length: q.roots.length }, () => null),
    };
  });
  const [busy, setBusy] = useState(false);

  // Bassline plays piano + bass at once; preload both so the first take
  // doesn't stall on instrument download.
  useEffect(() => {
    void loadInstrument('piano');
    void loadInstrument('bass');
  }, []);

  const play = useCallback(async () => {
    setBusy(true);
    try { await playBasslineQuestion(s.question, knobs.tempo); }
    finally {
      setBusy(false);
      setS((cur) =>
        cur.phase === 'idle' ? { ...cur, phase: 'played' } : cur,
      );
    }
  }, [s.question, knobs.tempo]);

  const pickRoot = useCallback((root: Root) => {
    setS((cur) => {
      if (cur.phase !== 'played' && cur.phase !== 'filling') return cur;
      const idx = cur.slots.findIndex((v) => v == null);
      if (idx === -1) return cur;
      const slots = [...cur.slots];
      slots[idx] = root;
      return { ...cur, slots, phase: 'filling' };
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
      const answer = cur.slots as Root[];
      const correct = isCorrectBassline(cur.question, answer);
      const fb = perSlotFeedback(cur.question, answer);
      recordTakeFor('bass-roots', correct);
      return { ...cur, phase: 'answered', correct, feedback: fb };
    });
  }, [recordTakeFor]);

  const next = useCallback(() => {
    const q = generateBasslineQuestion(knobs, level);
    setTakeNumber((n) => n + 1);
    setS({
      phase: 'idle',
      question: q,
      slots: Array.from({ length: q.roots.length }, () => null),
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
      <ExerciseHeader title="bass · bassline" level={level} instrument="bass" />

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
          <BasslineAnswers
            pool={s.question.poolRoots}
            length={knobs.length}
            disabled={s.phase === 'idle'}
            slots={s.slots}
            feedback={s.phase === 'answered' ? s.feedback : undefined}
            onPickRoot={pickRoot}
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
          answer={s.phase === 'answered' ? describeBassline(s.question) : undefined}
        />

        <div className="h-12 flex items-center">
          {s.phase === 'answered' && (
            <Button variant="secondary" onClick={next}>
              next take →
            </Button>
          )}
        </div>
      </section>

      <ExerciseFooter takeNumber={takeNumber} modeStats={stats['bass-roots']} />
    </main>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings } from '../state/settings';
import { useStats } from '../state/stats';
import { Button } from '../components/Button';
import { FeedbackLine } from '../components/FeedbackLine';
import { navigateHome } from '../lib/route';
import { levelLabel } from '../exercises/levels';
import { loadInstrument } from '../audio/instrument';
import {
  generatePianoNoteQuestion,
  playPianoTarget,
  playPianoTonic,
  isCorrectPianoNote,
  describePianoNote,
  poolDegrees,
  type PianoNoteQuestion,
} from '../exercises/pianoNote';
import { PianoNoteAnswers } from './modes/PianoNoteAnswers';
import type { Mode } from '../types';

type Phase = 'idle' | 'played' | 'answered';

type ExerciseState = {
  phase: Phase;
  question: PianoNoteQuestion;
  userAnswer?: string;
  correct?: boolean;
};

type Props = { mode: Mode };

export function Exercise({ mode }: Props) {
  if (mode !== 'piano-note') {
    return <NotImplemented />;
  }
  return <PianoNoteExercise />;
}

function PianoNoteExercise() {
  const { settings } = useSettings();
  const { stats, recordTakeFor } = useStats();
  const knobs = settings.pianoNote.knobs;
  const level = settings.pianoNote.level;

  const [takeNumber, setTakeNumber] = useState(1);
  const [exState, setExState] = useState<ExerciseState>(() => ({
    phase: 'idle',
    question: generatePianoNoteQuestion(knobs),
  }));
  const [busy, setBusy] = useState(false);

  const degreeOptions = useMemo(() => poolDegrees(knobs), [knobs]);
  const orderedOptions = useMemo(
    () => [...degreeOptions].sort((a, b) => a.semitones - b.semitones),
    [degreeOptions],
  );

  // Preload piano samples on mount so first play has minimal delay.
  useEffect(() => {
    loadInstrument('piano');
  }, []);

  const playTarget = useCallback(async () => {
    setBusy(true);
    try {
      await playPianoTarget(exState.question);
    } finally {
      setBusy(false);
      setExState((s) => (s.phase === 'idle' ? { ...s, phase: 'played' } : s));
    }
  }, [exState.question]);

  const playTonic = useCallback(async () => {
    setBusy(true);
    try {
      await playPianoTonic(exState.question);
    } finally {
      setBusy(false);
    }
  }, [exState.question]);

  const submit = useCallback(
    (label: string) => {
      if (exState.phase !== 'played') return;
      const correct = isCorrectPianoNote(exState.question, label);
      recordTakeFor('piano-note', correct);
      setExState((s) => ({ ...s, phase: 'answered', userAnswer: label, correct }));
    },
    [exState.phase, exState.question, recordTakeFor],
  );

  const next = useCallback(() => {
    setTakeNumber((n) => n + 1);
    setExState({
      phase: 'idle',
      question: generatePianoNoteQuestion(knobs),
    });
  }, [knobs]);

  // Keyboard shortcuts: space = play target, d = play tonic, 1-N = pick Nth
  // enabled note in pitch order, enter = next take after answering.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (exState.phase !== 'answered') void playTarget();
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        void playTonic();
        return;
      }
      if (e.key === 'Enter' && exState.phase === 'answered') {
        e.preventDefault();
        next();
        return;
      }
      const num = parseInt(e.key, 10);
      if (
        !Number.isNaN(num) &&
        num >= 1 &&
        num <= orderedOptions.length &&
        exState.phase === 'played'
      ) {
        submit(orderedOptions[num - 1]!.label);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exState.phase, orderedOptions, playTarget, playTonic, submit, next]);

  const modeStats = stats['piano-note'];
  const todayPct =
    modeStats.today.total > 0
      ? Math.round((modeStats.today.correct / modeStats.today.total) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
      <header className="mb-12 flex items-center justify-between">
        <button
          onClick={navigateHome}
          aria-label="back"
          className="text-paper-muted hover:text-paper transition-colors text-2xl px-2 -ml-2"
        >
          ←
        </button>
        <div className="text-center">
          <p className="font-display text-lg">piano · single note</p>
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-paper-faint mt-1">
            level {level === 'custom' ? '·' : level} · {levelLabel(level)}
          </p>
        </div>
        <span className="w-6" />
      </header>

      <section className="flex flex-col items-center gap-4 py-4">
        <Button
          onClick={playTarget}
          disabled={busy || exState.phase === 'answered'}
        >
          ▶ {exState.phase === 'idle' ? 'play' : 'replay'}
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={playTonic} disabled={busy}>
            ▶ do
          </Button>
          {exState.phase !== 'idle' && (
            <Button variant="secondary" onClick={playTarget} disabled={busy}>
              ↻ loop
            </Button>
          )}
        </div>

        <div className="my-8 w-full">
          <PianoNoteAnswers
            options={degreeOptions}
            disabled={exState.phase !== 'played'}
            picked={exState.userAnswer}
            onPick={submit}
          />
        </div>

        <FeedbackLine
          state={
            exState.phase === 'answered'
              ? exState.correct
                ? 'correct'
                : 'wrong'
              : 'idle'
          }
          answer={
            exState.phase === 'answered'
              ? describePianoNote(exState.question)
              : undefined
          }
        />

        <div className="h-12 flex items-center">
          {exState.phase === 'answered' && (
            <Button variant="secondary" onClick={next}>
              next take →
            </Button>
          )}
        </div>
      </section>

      <footer className="mt-12 text-center font-sans text-xs uppercase tracking-[0.18em] text-paper-faint tabular-nums">
        take {takeNumber} · streak {modeStats.streakDays} ·{' '}
        {modeStats.today.correct}/{modeStats.today.total} · {todayPct}%
      </footer>
    </main>
  );
}

function NotImplemented() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <button
        onClick={navigateHome}
        className="text-paper-muted hover:text-paper transition-colors"
      >
        ← back
      </button>
      <p className="mt-12 font-display italic text-paper-muted">
        coming next milestone.
      </p>
    </main>
  );
}

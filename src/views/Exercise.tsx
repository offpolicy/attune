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
  makeLabelFor,
  type PianoNoteQuestion,
} from '../exercises/pianoNote';
import { PianoNoteAnswers } from './modes/PianoNoteAnswers';
import type { Mode } from '../types';

type Phase = 'idle' | 'played' | 'answered';

type ExerciseState = {
  phase: Phase;
  question: PianoNoteQuestion;
  userAnswer?: number;
  correct?: boolean;
};

// White-key shortcuts: 1–7 → C D E F G A B (do re mi fa sol la ti).
const NUMBER_TO_SEMITONES: Record<string, number> = {
  '1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11,
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

  const labelFor = useMemo(() => makeLabelFor(knobs.labels), [knobs.labels]);

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
    (semitones: number) => {
      if (exState.phase !== 'played') return;
      const correct = isCorrectPianoNote(exState.question, semitones);
      recordTakeFor('piano-note', correct);
      setExState((s) => ({
        ...s,
        phase: 'answered',
        userAnswer: semitones,
        correct,
      }));
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

  // Keyboard shortcuts.
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
      const semi = NUMBER_TO_SEMITONES[e.key];
      if (semi !== undefined && exState.phase === 'played') {
        submit(semi);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exState.phase, playTarget, playTonic, submit, next]);

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
            disabled={exState.phase !== 'played'}
            picked={exState.userAnswer}
            onPick={submit}
            labelFor={labelFor}
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

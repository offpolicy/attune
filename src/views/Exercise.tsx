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
  playPianoNoteQuestion,
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
    question: generatePianoNoteQuestion(knobs, true),
  }));
  const [playing, setPlaying] = useState(false);

  const degreeOptions = useMemo(() => poolDegrees(knobs), [knobs]);

  // Preload piano samples on mount so first play has minimal delay.
  useEffect(() => {
    loadInstrument('piano');
  }, []);

  const play = useCallback(async () => {
    setPlaying(true);
    try {
      await playPianoNoteQuestion(exState.question);
    } finally {
      setPlaying(false);
      setExState((s) => (s.phase === 'idle' ? { ...s, phase: 'played' } : s));
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
      question: generatePianoNoteQuestion(knobs, false),
    });
  }, [knobs]);

  // Keyboard shortcuts: space (play/loop), 1-9 (pick), enter (next).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (exState.phase === 'idle' || exState.phase === 'played') void play();
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
        num <= degreeOptions.length &&
        exState.phase === 'played'
      ) {
        submit(degreeOptions[num - 1]!.label);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [exState.phase, degreeOptions, play, submit, next]);

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

      <section className="flex flex-col items-center gap-4 py-8">
        <Button
          onClick={play}
          disabled={playing || exState.phase === 'answered'}
        >
          ▶ {exState.phase === 'idle' ? 'play' : 'replay'}
        </Button>

        <div className="h-12 flex items-center">
          {exState.phase !== 'idle' && (
            <Button variant="secondary" onClick={play} disabled={playing}>
              ↻ loop
            </Button>
          )}
        </div>

        <div className="my-6">
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

      <footer className="mt-16 text-center font-sans text-xs uppercase tracking-[0.18em] text-paper-faint tabular-nums">
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings } from '../../state/settings';
import { useStats } from '../../state/stats';
import { Button } from '../../components/Button';
import { FeedbackLine } from '../../components/FeedbackLine';
import { loadInstrument } from '../../audio/instrument';
import {
  generatePianoNoteQuestion,
  playPianoTarget,
  playPianoTonic,
  isCorrectPianoNote,
  describePianoNote,
  makeLabelFor,
  type PianoNoteQuestion,
} from '../../exercises/pianoNote';
import { PianoNoteAnswers } from './PianoNoteAnswers';
import { ExerciseHeader, ExerciseFooter } from './ExerciseChrome';

type Phase = 'idle' | 'played' | 'answered';

type State = {
  phase: Phase;
  question: PianoNoteQuestion;
  userAnswer?: number;
  correct?: boolean;
};

const NUMBER_TO_SEMITONES: Record<string, number> = {
  '1': 0, '2': 2, '3': 4, '4': 5, '5': 7, '6': 9, '7': 11,
};

export function PianoNoteExercise() {
  const { settings } = useSettings();
  const { stats, recordTakeFor } = useStats();
  const knobs = settings.pianoNote.knobs;
  const level = settings.pianoNote.level;

  const [takeNumber, setTakeNumber] = useState(1);
  const [s, setS] = useState<State>(() => ({
    phase: 'idle',
    question: generatePianoNoteQuestion(knobs),
  }));
  const [busy, setBusy] = useState(false);

  const labelFor = useMemo(() => makeLabelFor(knobs.labels), [knobs.labels]);

  useEffect(() => { void loadInstrument('piano'); }, []);

  const playTarget = useCallback(async () => {
    setBusy(true);
    try { await playPianoTarget(s.question); }
    finally {
      setBusy(false);
      setS((cur) => (cur.phase === 'idle' ? { ...cur, phase: 'played' } : cur));
    }
  }, [s.question]);

  const playTonic = useCallback(async () => {
    setBusy(true);
    try { await playPianoTonic(s.question); }
    finally { setBusy(false); }
  }, [s.question]);

  const submit = useCallback((semitones: number) => {
    if (s.phase !== 'played') return;
    const correct = isCorrectPianoNote(s.question, semitones);
    recordTakeFor('piano-note', correct);
    setS((cur) => ({ ...cur, phase: 'answered', userAnswer: semitones, correct }));
  }, [s.phase, s.question, recordTakeFor]);

  const next = useCallback(() => {
    setTakeNumber((n) => n + 1);
    setS({ phase: 'idle', question: generatePianoNoteQuestion(knobs) });
  }, [knobs]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (s.phase !== 'answered') void playTarget();
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        void playTonic();
        return;
      }
      if (e.key === 'Enter' && s.phase === 'answered') {
        e.preventDefault();
        next();
        return;
      }
      const semi = NUMBER_TO_SEMITONES[e.key];
      if (semi !== undefined && s.phase === 'played') submit(semi);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [s.phase, playTarget, playTonic, submit, next]);

  return (
    <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
      <ExerciseHeader title="piano · single note" level={level} instrument="piano" />

      <section className="flex flex-col items-center gap-4 py-4">
        <Button
          onClick={playTarget}
          disabled={busy || s.phase === 'answered'}
        >
          ▶ {s.phase === 'idle' ? 'play' : 'replay'}
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={playTonic} disabled={busy}>
            ▶ do
          </Button>
          {s.phase !== 'idle' && (
            <Button variant="secondary" onClick={playTarget} disabled={busy}>
              ↻ loop
            </Button>
          )}
        </div>

        <div className="my-8 w-full">
          <PianoNoteAnswers
            disabled={s.phase !== 'played'}
            picked={s.userAnswer}
            onPick={submit}
            labelFor={labelFor}
          />
        </div>

        <FeedbackLine
          state={s.phase === 'answered' ? (s.correct ? 'correct' : 'wrong') : 'idle'}
          answer={s.phase === 'answered' ? describePianoNote(s.question) : undefined}
        />

        <div className="h-12 flex items-center">
          {s.phase === 'answered' && (
            <Button variant="secondary" onClick={next}>
              next take →
            </Button>
          )}
        </div>
      </section>

      <ExerciseFooter takeNumber={takeNumber} modeStats={stats['piano-note']} />
    </main>
  );
}

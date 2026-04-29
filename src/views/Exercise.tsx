import { PianoNoteExercise } from './modes/PianoNoteExercise';
import { GuitarChordExercise } from './modes/GuitarChordExercise';
import { GuitarProgressionExercise } from './modes/GuitarProgressionExercise';
import type { Mode } from '../types';

type Props = { mode: Mode };

export function Exercise({ mode }: Props) {
  switch (mode) {
    case 'piano-note':
      return <PianoNoteExercise />;
    case 'guitar-chord':
      return <GuitarChordExercise />;
    case 'guitar-prog':
      return <GuitarProgressionExercise />;
  }
}

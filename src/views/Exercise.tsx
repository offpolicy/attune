import { PianoNoteExercise } from './modes/PianoNoteExercise';
import { GuitarChordExercise } from './modes/GuitarChordExercise';
import { GuitarProgressionExercise } from './modes/GuitarProgressionExercise';
import { splitMode, type Mode } from '../types';

type Props = { mode: Mode };

export function Exercise({ mode }: Props) {
  const { activity } = splitMode(mode);
  switch (activity) {
    case 'note':
      return <PianoNoteExercise mode={mode} />;
    case 'chord':
      return <GuitarChordExercise mode={mode} />;
    case 'prog':
      return <GuitarProgressionExercise mode={mode} />;
  }
}

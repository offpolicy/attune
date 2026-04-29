import { PianoKeyboard } from '../../components/PianoKeyboard';

type Props = {
  disabled: boolean;
  picked?: number;
  onPick: (semitones: number) => void;
  labelFor: (semitones: number) => string;
};

export function PianoNoteAnswers(props: Props) {
  return <PianoKeyboard {...props} />;
}

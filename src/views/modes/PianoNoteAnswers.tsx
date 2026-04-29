import { PianoKeyboard } from '../../components/PianoKeyboard';
import type { DegreeOption } from '../../exercises/pianoNote';

type Props = {
  options: DegreeOption[];
  disabled: boolean;
  picked?: string;
  onPick: (label: string) => void;
};

export function PianoNoteAnswers({ options, disabled, picked, onPick }: Props) {
  return (
    <PianoKeyboard pool={options} disabled={disabled} picked={picked} onPick={onPick} />
  );
}

import { AnswerChip } from '../../components/AnswerChip';
import type { DegreeOption } from '../../exercises/pianoNote';

type Props = {
  options: DegreeOption[];
  disabled: boolean;
  picked?: string;
  onPick: (label: string) => void;
};

export function PianoNoteAnswers({ options, disabled, picked, onPick }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
      {options.map((opt) => (
        <AnswerChip
          key={opt.label}
          label={opt.label}
          selected={picked === opt.label}
          onClick={() => onPick(opt.label)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

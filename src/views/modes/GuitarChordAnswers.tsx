import { AnswerChip } from '../../components/AnswerChip';
import type { ChordName } from '../../exercises/chords';

const DISPLAY_ORDER: ChordName[] = [
  'C', 'D', 'E', 'F', 'G', 'A',
  'Am', 'Dm', 'Em',
  'Bdim',
  'A7', 'D7', 'E7', 'G7',
  'Am7', 'Dm7', 'Em7', 'Cmaj7',
];

type Props = {
  pool: ChordName[];
  disabled: boolean;
  picked?: ChordName;
  onPick: (chord: ChordName) => void;
};

export function GuitarChordAnswers({ pool, disabled, picked, onPick }: Props) {
  const ordered = DISPLAY_ORDER.filter((c) => pool.includes(c));
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
      {ordered.map((c) => (
        <AnswerChip
          key={c}
          label={c}
          selected={picked === c}
          disabled={disabled}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}

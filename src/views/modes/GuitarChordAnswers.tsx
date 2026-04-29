import { AnswerChip } from '../../components/AnswerChip';
import { ALL_ROOTS, ALL_SUFFIXES } from '../../exercises/chords';
import type { ChordName } from '../../exercises/chords';

// Suffix-major ordering: triads grouped together first, then 6ths, 7ths,
// 9ths, etc. Within each suffix, roots in the canonical chromatic order
// from chordLibrary. Pool filtering narrows the rendered set to the user's
// actual selection, so chip count is bounded by the active pool, not by
// this 731-name superset.
const DISPLAY_ORDER: ChordName[] = ALL_SUFFIXES.flatMap((s) =>
  ALL_ROOTS.map((r) => `${r}${s}` as ChordName),
);

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

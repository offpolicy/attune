import { AnswerChip } from '../../components/AnswerChip';
import type { ChordName } from '../../exercises/chords';

// Every ChordName any qualityScheme can produce against the diatonic Roman
// pool in C, ordered by Roman function (I, ii, iii, IV, V, vi, vii°) and
// then by harmonic colour (triad → 7th → extension → altered). The pool
// prop carries the active scheme's possibilities; chips outside the pool
// are filtered out, so this ordering is what the user sees per level.
const DISPLAY_ORDER: ChordName[] = [
  // I
  'C', 'Cmaj7', 'Cmaj9', 'C6/9',
  // ii
  'Dm', 'Dm7', 'Dm9',
  // iii
  'Em', 'Em7',
  // IV
  'F', 'Fmaj7', 'Fmaj9', 'F6/9',
  // V
  'G', 'G7', 'G9', 'G13', 'G7b9', 'G7#9',
  // vi
  'Am', 'Am7', 'Am9',
  // vii°
  'Bdim', 'Bm7b5',
];

type Props = {
  pool: ChordName[];
  length: 3 | 4;
  disabled: boolean;
  slots: (ChordName | null)[];
  feedback?: boolean[];
  onPickChord: (chord: ChordName) => void;
  onClearSlot: (slotIndex: number) => void;
};

export function GuitarProgressionAnswers({
  pool,
  length,
  disabled,
  slots,
  feedback,
  onPickChord,
  onClearSlot,
}: Props) {
  const ordered = DISPLAY_ORDER.filter((c) => pool.includes(c));

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center gap-2 justify-center">
        {Array.from({ length }, (_, i) => {
          const value = slots[i] ?? null;
          const fb = feedback?.[i];
          return (
            <SlotChip
              key={i}
              value={value}
              feedback={fb}
              disabled={disabled || feedback != null}
              onClick={() => {
                if (feedback != null) return;
                if (value) onClearSlot(i);
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
        {ordered.map((c) => (
          <AnswerChip
            key={c}
            label={c}
            disabled={disabled || feedback != null}
            onClick={() => onPickChord(c)}
          />
        ))}
      </div>
    </div>
  );
}

type SlotProps = {
  value: ChordName | null;
  feedback?: boolean;
  disabled: boolean;
  onClick: () => void;
};

function SlotChip({ value, feedback, disabled, onClick }: SlotProps) {
  const palette =
    feedback === true
      ? 'border-leaf-400 text-leaf-400'
      : feedback === false
      ? 'border-paper-muted text-paper-muted line-through'
      : value
      ? 'border-lamp-400 text-lamp-400'
      : 'border-ink-700 text-paper-faint border-dashed';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[4rem] h-12 px-3 rounded-md font-display text-base font-medium border bg-transparent flex items-center justify-center gap-1 transition-colors disabled:cursor-default ${palette}`}
    >
      {feedback === true && <span className="not-italic">✓</span>}
      {feedback === false && <span className="not-italic">✗</span>}
      <span>{value ?? '·'}</span>
    </button>
  );
}

import { AnswerChip } from '../../components/AnswerChip';
import type { Root } from '../../exercises/chords';

// Diatonic root names in scale-degree order, C major. Other keys would
// transpose; for v1 only C is supported and this matches the prog mode.
const DISPLAY_ORDER: Root[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

type Props = {
  pool: Root[];
  length: 3 | 4;
  disabled: boolean;
  slots: (Root | null)[];
  feedback?: boolean[];
  onPickRoot: (root: Root) => void;
  onClearSlot: (slotIndex: number) => void;
};

export function BasslineAnswers({
  pool,
  length,
  disabled,
  slots,
  feedback,
  onPickRoot,
  onClearSlot,
}: Props) {
  const ordered = DISPLAY_ORDER.filter((r) => pool.includes(r));

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
        {ordered.map((r) => (
          <AnswerChip
            key={r}
            label={r}
            disabled={disabled || feedback != null}
            onClick={() => onPickRoot(r)}
          />
        ))}
      </div>
    </div>
  );
}

type SlotProps = {
  value: Root | null;
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

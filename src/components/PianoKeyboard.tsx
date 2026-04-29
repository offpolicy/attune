import type { DegreeOption } from '../exercises/pianoNote';

type Props = {
  pool: DegreeOption[];
  disabled: boolean;
  picked?: string;
  onPick: (label: string) => void;
};

const WHITE_KEYS: { semitones: number; pc: string }[] = [
  { semitones: 0,  pc: 'C' },
  { semitones: 2,  pc: 'D' },
  { semitones: 4,  pc: 'E' },
  { semitones: 5,  pc: 'F' },
  { semitones: 7,  pc: 'G' },
  { semitones: 9,  pc: 'A' },
  { semitones: 11, pc: 'B' },
];

const BLACK_KEYS: { semitones: number; pc: string; leftPct: number }[] = [
  { semitones: 1,  pc: 'C#', leftPct: 10.0 },
  { semitones: 3,  pc: 'D#', leftPct: 24.3 },
  { semitones: 6,  pc: 'F#', leftPct: 52.86 },
  { semitones: 8,  pc: 'G#', leftPct: 67.14 },
  { semitones: 10, pc: 'A#', leftPct: 81.43 },
];

const BLACK_WIDTH_PCT = 8.57;

export function PianoKeyboard({ pool, disabled, picked, onPick }: Props) {
  const labelFor = (semitones: number): string | undefined =>
    pool.find((o) => o.semitones === semitones)?.label;

  const tryPick = (semitones: number) => {
    if (disabled) return;
    const label = labelFor(semitones);
    if (label) onPick(label);
  };

  return (
    <div className="relative w-full max-w-md mx-auto select-none" style={{ aspectRatio: '7 / 3' }}>
      {/* white keys */}
      <div className="absolute inset-0 flex">
        {WHITE_KEYS.map(({ semitones, pc }, i) => {
          const label = labelFor(semitones);
          const enabled = label != null && !disabled;
          const isFirst = i === 0;
          const isLast = i === WHITE_KEYS.length - 1;
          const isSelected = enabled && picked === label;

          const cls = [
            'relative flex-1 h-full border-r border-ink-700 last:border-r-0 transition-colors',
            isFirst ? 'rounded-bl-md' : '',
            isLast ? 'rounded-br-md' : '',
            isSelected
              ? 'bg-lamp-400 text-ink-950'
              : enabled
              ? 'bg-paper text-ink-950 hover:bg-lamp-300 active:bg-lamp-400'
              : 'bg-paper/25 text-paper-faint cursor-not-allowed',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 focus-visible:z-20',
          ].join(' ');

          return (
            <button
              key={pc}
              type="button"
              disabled={!enabled}
              onClick={() => tryPick(semitones)}
              aria-label={label ? `pick ${label}` : `${pc} (not in this level)`}
              className={cls}
            >
              {label && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-display text-sm font-medium">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* black keys (overlay) */}
      {BLACK_KEYS.map(({ semitones, pc, leftPct }) => {
        const label = labelFor(semitones);
        const enabled = label != null && !disabled;
        const isSelected = enabled && picked === label;

        const cls = [
          'absolute top-0 h-3/5 rounded-b border border-ink-700 transition-colors z-10',
          isSelected
            ? 'bg-lamp-400 text-ink-950'
            : enabled
            ? 'bg-ink-800 text-paper hover:bg-ink-700 active:bg-lamp-400 active:text-ink-950'
            : 'bg-ink-900/70 text-paper-faint cursor-not-allowed',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 focus-visible:z-20',
        ].join(' ');

        return (
          <button
            key={pc}
            type="button"
            disabled={!enabled}
            onClick={() => tryPick(semitones)}
            aria-label={label ? `pick ${label}` : `${pc} (not in this level)`}
            style={{ left: `${leftPct}%`, width: `${BLACK_WIDTH_PCT}%` }}
            className={cls}
          >
            {label && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 font-display text-[10px] font-medium leading-none">
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

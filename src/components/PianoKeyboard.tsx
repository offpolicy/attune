type Props = {
  disabled: boolean;
  picked?: number;
  onPick: (semitones: number) => void;
  labelFor: (semitones: number) => string;
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
  { semitones: 1,  pc: 'C#', leftPct: 10.0  },
  { semitones: 3,  pc: 'D#', leftPct: 24.3  },
  { semitones: 6,  pc: 'F#', leftPct: 52.86 },
  { semitones: 8,  pc: 'G#', leftPct: 67.14 },
  { semitones: 10, pc: 'A#', leftPct: 81.43 },
];

const BLACK_WIDTH_PCT = 8.57;

export function PianoKeyboard({ disabled, picked, onPick, labelFor }: Props) {
  const handleClick = (semitones: number) => {
    if (!disabled) onPick(semitones);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="piano-frame">
        <div className="piano-felt" />
        <div className="piano-board">
          <div className="absolute inset-0 flex">
            {WHITE_KEYS.map(({ semitones, pc }) => {
              const isSelected = picked === semitones;
              const label = labelFor(semitones);
              return (
                <button
                  key={pc}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleClick(semitones)}
                  aria-label={label ? `${label} (${pc})` : pc}
                  className={`piano-white focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:z-20 ${
                    isSelected ? 'piano-key-selected' : ''
                  }`}
                >
                  {label && (
                    <span className="piano-label piano-label-white">{label}</span>
                  )}
                </button>
              );
            })}
          </div>
          {BLACK_KEYS.map(({ semitones, pc, leftPct }) => {
            const isSelected = picked === semitones;
            const label = labelFor(semitones);
            return (
              <button
                key={pc}
                type="button"
                disabled={disabled}
                onClick={() => handleClick(semitones)}
                aria-label={label ? `${label} (${pc})` : pc}
                style={{ left: `${leftPct}%`, width: `${BLACK_WIDTH_PCT}%` }}
                className={`piano-black focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:z-20 ${
                  isSelected ? 'piano-key-selected' : ''
                }`}
              >
                {label && (
                  <span className="piano-label piano-label-black">{label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

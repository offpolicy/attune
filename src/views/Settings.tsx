import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { navigateHome } from '../lib/route';
import {
  useSettings,
  type Level,
  type PianoNoteKnobs,
  type GuitarChordKnobs,
  type GuitarProgKnobs,
} from '../state/settings';
import { useStats } from '../state/stats';
import {
  LEVEL_NAMES,
  PIANO_LEVEL_PRESETS,
  GUITAR_CHORD_LEVEL_PRESETS,
  GUITAR_PROG_LEVEL_PRESETS,
} from '../exercises/levels';
import type { ChordName, Roman } from '../exercises/chords';

const ALL_CHORDS: { group: string; chords: ChordName[] }[] = [
  { group: 'open majors',       chords: ['C', 'D', 'E', 'F', 'G', 'A'] },
  { group: 'open minors',       chords: ['Am', 'Dm', 'Em'] },
  { group: 'diminished',        chords: ['Bdim'] },
  { group: 'dominant 7ths',     chords: ['G7', 'D7', 'A7', 'E7'] },
  { group: 'major / minor 7ths', chords: ['Cmaj7', 'Am7', 'Dm7', 'Em7'] },
];

const ALL_ROMANS: Roman[] = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

export function SettingsView() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
      <header className="mb-12 flex items-center justify-between">
        <button
          onClick={navigateHome}
          aria-label="close"
          className="text-paper-muted hover:text-paper transition-colors text-3xl leading-none px-2 -ml-2"
        >
          ×
        </button>
        <p className="font-display text-lg">settings</p>
        <span className="w-6" />
      </header>

      <div className="space-y-12">
        <PianoSection />
        <GuitarChordSection />
        <GuitarProgSection />
        <DataSection />
      </div>
    </main>
  );
}

// ────────── piano ──────────

function PianoSection() {
  const { settings, setSettings } = useSettings();
  const cur = settings.pianoNote;

  const setLevel = (level: Level) => {
    if (level === 'custom') return;
    setSettings({
      ...settings,
      pianoNote: { level, knobs: PIANO_LEVEL_PRESETS[level] },
    });
  };

  const setKnob = <K extends keyof PianoNoteKnobs>(key: K, value: PianoNoteKnobs[K]) => {
    setSettings({
      ...settings,
      pianoNote: { level: 'custom', knobs: { ...cur.knobs, [key]: value } },
    });
  };

  const rangeKey = `${cur.knobs.range[0]}-${cur.knobs.range[1]}`;

  return (
    <Section title="piano · single note" subtitle="name the note">
      <LevelSegments current={cur.level} onChange={setLevel} />

      <Disclosure summary="fine-tune">
        <KnobRow label="pool">
          <Select
            value={cur.knobs.pool}
            onChange={(v) => setKnob('pool', v as PianoNoteKnobs['pool'])}
            options={[
              ['tonic-triad',          'tonic triad (do mi sol)'],
              ['diatonic',             'diatonic (do re mi fa sol la ti)'],
              ['diatonic+accidentals', 'diatonic + accidentals'],
              ['chromatic',            'chromatic (all 12)'],
            ]}
          />
        </KnobRow>
        <KnobRow label="range">
          <Select
            value={rangeKey}
            onChange={(v) => {
              const [a, b] = v.split('-').map(Number);
              setKnob('range', [a!, b!] as [number, number]);
            }}
            options={[
              ['60-72', 'C4 – C5 (1 octave)'],
              ['48-72', 'C3 – C5 (2 octaves)'],
              ['48-84', 'C3 – C6 (3 octaves)'],
            ]}
          />
        </KnobRow>
        <KnobRow label="labels">
          <ToggleGroup
            value={cur.knobs.labels}
            onChange={(v) => setKnob('labels', v as 'solfege' | 'numeric')}
            options={[['solfege', 'solfege'], ['numeric', '1–7']]}
          />
        </KnobRow>
      </Disclosure>
    </Section>
  );
}

// ────────── guitar chord ──────────

function GuitarChordSection() {
  const { settings, setSettings } = useSettings();
  const cur = settings.guitarChord;

  const setLevel = (level: Level) => {
    if (level === 'custom') return;
    setSettings({
      ...settings,
      guitarChord: { level, knobs: GUITAR_CHORD_LEVEL_PRESETS[level] },
    });
  };

  const setKnob = <K extends keyof GuitarChordKnobs>(
    key: K,
    value: GuitarChordKnobs[K],
  ) => {
    setSettings({
      ...settings,
      guitarChord: { level: 'custom', knobs: { ...cur.knobs, [key]: value } },
    });
  };

  const togglePool = (chord: ChordName) => {
    const next = cur.knobs.pool.includes(chord)
      ? cur.knobs.pool.filter((c) => c !== chord)
      : [...cur.knobs.pool, chord];
    if (next.length === 0) return; // never empty the pool
    setKnob('pool', next);
  };

  return (
    <Section title="guitar · chord" subtitle="name the chord">
      <LevelSegments current={cur.level} onChange={setLevel} />

      <Disclosure summary="fine-tune">
        <div className="space-y-4">
          <KnobLabel>pool</KnobLabel>
          {ALL_CHORDS.map(({ group, chords }) => (
            <div key={group}>
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-paper-faint mb-2">
                {group}
              </p>
              <div className="flex flex-wrap gap-2">
                {chords.map((chord) => (
                  <CheckboxChip
                    key={chord}
                    label={chord}
                    checked={cur.knobs.pool.includes(chord)}
                    onChange={() => togglePool(chord)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Disclosure>
    </Section>
  );
}

// ────────── guitar progression ──────────

function GuitarProgSection() {
  const { settings, setSettings } = useSettings();
  const cur = settings.guitarProg;

  const setLevel = (level: Level) => {
    if (level === 'custom') return;
    setSettings({
      ...settings,
      guitarProg: { level, knobs: GUITAR_PROG_LEVEL_PRESETS[level] },
    });
  };

  const setKnob = <K extends keyof GuitarProgKnobs>(
    key: K,
    value: GuitarProgKnobs[K],
  ) => {
    setSettings({
      ...settings,
      guitarProg: { level: 'custom', knobs: { ...cur.knobs, [key]: value } },
    });
  };

  const togglePool = (roman: Roman) => {
    const next = cur.knobs.pool.includes(roman)
      ? cur.knobs.pool.filter((r) => r !== roman)
      : [...cur.knobs.pool, roman];
    if (next.length < 2) return; // need at least 2 to build a progression
    if (!next.includes('I')) return; // tonic always required
    setKnob('pool', next);
  };

  return (
    <Section title="guitar · progression" subtitle="name the changes">
      <LevelSegments current={cur.level} onChange={setLevel} />

      <Disclosure summary="fine-tune">
        <KnobRow label="length">
          <ToggleGroup
            value={String(cur.knobs.length)}
            onChange={(v) => setKnob('length', Number(v) as 3 | 4)}
            options={[['3', '3 chords'], ['4', '4 chords']]}
          />
        </KnobRow>
        <KnobRow label="tempo">
          <ToggleGroup
            value={cur.knobs.tempo}
            onChange={(v) => setKnob('tempo', v as 'slow' | 'medium' | 'fast')}
            options={[
              ['slow', 'slow'],
              ['medium', 'medium'],
              ['fast', 'fast'],
            ]}
          />
        </KnobRow>
        <KnobRow label="pool">
          <div className="flex flex-wrap gap-2">
            {ALL_ROMANS.map((r) => (
              <CheckboxChip
                key={r}
                label={r}
                checked={cur.knobs.pool.includes(r)}
                onChange={() => togglePool(r)}
                disabled={r === 'I'}
              />
            ))}
          </div>
        </KnobRow>
      </Disclosure>
    </Section>
  );
}

// ────────── data ──────────

function DataSection() {
  const { reset } = useStats();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <Section title="data">
        <p className="font-sans text-sm text-paper-muted mb-4">
          reset all stats? this clears streaks, today's accuracy, and best
          scores. your settings stay.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            cancel
          </Button>
          <Button
            onClick={() => {
              reset();
              setConfirming(false);
            }}
          >
            yes, reset
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section title="data">
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        reset progress
      </Button>
    </Section>
  );
}

// ────────── primitives ──────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <header className="mb-6">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="font-display italic text-paper-muted text-sm mt-1">
            {subtitle}
          </p>
        )}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function LevelSegments({
  current,
  onChange,
}: {
  current: Level;
  onChange: (level: Level) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n as Level)}
            aria-label={`level ${n} (${LEVEL_NAMES[n as 1 | 2 | 3 | 4 | 5]})`}
            className={`w-10 h-10 rounded-full font-sans text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 ${
              current === n
                ? 'bg-lamp-400 text-ink-950'
                : 'bg-ink-850 text-paper-muted hover:bg-ink-800 hover:text-paper border border-ink-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="mt-3 font-sans text-xs uppercase tracking-[0.18em] text-paper-muted text-center tabular-nums">
        {current === 'custom'
          ? 'custom'
          : `level ${current} · ${LEVEL_NAMES[current]}`}
      </p>
    </div>
  );
}

function Disclosure({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-ink-700 bg-ink-850/40 overflow-hidden">
      <summary className="cursor-pointer list-none px-4 py-3 font-sans text-sm font-medium text-paper-muted hover:text-paper flex items-center gap-2 select-none">
        <span className="transition-transform group-open:rotate-90 inline-block w-3">›</span>
        {summary}
      </summary>
      <div className="px-4 pb-4 pt-2 space-y-4">{children}</div>
    </details>
  );
}

function KnobRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <KnobLabel>{label}</KnobLabel>
      <div className="flex-1 sm:max-w-md">{children}</div>
    </div>
  );
}

function KnobLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-sans text-xs uppercase tracking-[0.22em] text-paper-faint min-w-20">
      {children}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-ink-850 text-paper border border-ink-700 rounded-md px-3 h-10 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-lamp-300 focus:ring-offset-2 focus:ring-offset-ink-900 hover:border-paper-faint cursor-pointer"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v} className="bg-ink-850 text-paper">
          {label}
        </option>
      ))}
    </select>
  );
}

function ToggleGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="inline-flex rounded-md border border-ink-700 bg-ink-850 overflow-hidden">
      {options.map(([v, label]) => {
        const selected = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`px-3 h-10 font-sans text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:z-10 ${
              selected
                ? 'bg-lamp-400 text-ink-950'
                : 'text-paper-muted hover:text-paper hover:bg-ink-800'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxChip({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`px-3 h-9 rounded-md font-display text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed ${
        checked
          ? 'bg-lamp-400 text-ink-950 border-lamp-400'
          : 'bg-transparent text-paper-muted border-ink-700 hover:border-paper-faint hover:text-paper'
      } ${disabled ? 'opacity-70' : ''}`}
    >
      {label}
    </button>
  );
}

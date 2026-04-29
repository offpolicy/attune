import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button';
import { HelpTip } from '../components/HelpTip';
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
import type { ChordName, ChordSuffix, Roman, Root } from '../exercises/chords';
import type { QualityScheme } from '../exercises/progressionTemplates';

// The picker shows 12 canonical sharp roots. Flat enharmonic spellings exist
// in the ChordName type and play identically; surfacing both in the picker
// would create confusing duplicates, so flats are intentionally omitted here.
const PICKER_ROOTS: Root[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

type QualityRowSpec = { suffix: ChordSuffix; label: string };
type QualityGroup = { title: string; defaultOpen?: boolean; qualities: QualityRowSpec[] };

const QUALITY_GROUPS: QualityGroup[] = [
  {
    title: 'triads & power',
    defaultOpen: true,
    qualities: [
      { suffix: '',     label: 'maj' },
      { suffix: 'm',    label: 'min' },
      { suffix: 'dim',  label: 'dim' },
      { suffix: 'aug',  label: 'aug' },
      { suffix: 'sus2', label: 'sus2' },
      { suffix: 'sus4', label: 'sus4' },
      { suffix: '5',    label: '5 (power)' },
    ],
  },
  {
    title: 'sixths',
    qualities: [
      { suffix: '6',    label: '6' },
      { suffix: 'm6',   label: 'm6' },
      { suffix: '6/9',  label: '6/9' },
      { suffix: 'm6/9', label: 'm6/9' },
    ],
  },
  {
    title: '7ths',
    qualities: [
      { suffix: '7',     label: '7 (dom)' },
      { suffix: 'maj7',  label: 'maj7' },
      { suffix: 'm7',    label: 'm7' },
      { suffix: 'mMaj7', label: 'mMaj7' },
      { suffix: 'dim7',  label: 'dim7' },
      { suffix: 'm7b5',  label: 'm7b5' },
    ],
  },
  {
    title: '7ths altered & sus',
    qualities: [
      { suffix: '7sus4',  label: '7sus4' },
      { suffix: '7sus2',  label: '7sus2' },
      { suffix: '7b5',    label: '7b5' },
      { suffix: '7#5',    label: '7#5' },
      { suffix: 'maj7#5', label: 'maj7#5' },
      { suffix: 'maj7b5', label: 'maj7b5' },
    ],
  },
  {
    title: 'adds (no 7)',
    qualities: [
      { suffix: 'add9',   label: 'add9' },
      { suffix: 'madd9',  label: 'madd9' },
      { suffix: 'add11',  label: 'add11' },
      { suffix: 'madd11', label: 'madd11' },
    ],
  },
  {
    title: '9ths',
    qualities: [
      { suffix: '9',     label: '9' },
      { suffix: 'maj9',  label: 'maj9' },
      { suffix: 'm9',    label: 'm9' },
      { suffix: 'mMaj9', label: 'mMaj9' },
      { suffix: '9sus4', label: '9sus4' },
      { suffix: '7b9',   label: '7b9' },
      { suffix: '7#9',   label: '7#9' },
    ],
  },
  {
    title: '11ths',
    qualities: [
      { suffix: '11',      label: '11' },
      { suffix: 'm11',     label: 'm11' },
      { suffix: 'maj11',   label: 'maj11' },
      { suffix: '7#11',    label: '7#11' },
      { suffix: 'maj7#11', label: 'maj7#11' },
    ],
  },
  {
    title: '13ths',
    qualities: [
      { suffix: '13',     label: '13' },
      { suffix: 'maj13',  label: 'maj13' },
      { suffix: 'm13',    label: 'm13' },
      { suffix: '13sus4', label: '13sus4' },
    ],
  },
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
        <KnobRow
          label="pool"
          help="Which notes can appear as the question. Tonic triad: do/mi/sol only. Diatonic: all 7 scale tones. +Accidentals: includes the 5 black keys. Chromatic: all 12."
        >
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
        <KnobRow
          label="range"
          help="Vertical span the question can land in. Wider ranges train octave recognition on top of pitch."
        >
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
        <KnobRow
          label="labels"
          help="How the answer keys are labelled. Solfege uses fixed-do (do re mi fa sol la ti); numeric uses 1–7."
        >
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
    <Section title="guitar · single chord" subtitle="name the chord">
      <LevelSegments current={cur.level} onChange={setLevel} />

      <Disclosure summary="fine-tune">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <KnobLabel help="Which chords can appear as the question. Categories are collapsible; expand the ones you want to draw from. Picker shows sharp spellings — flat names sound identical and aren't shown to avoid duplicates.">
              pool
            </KnobLabel>
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-paper-faint tabular-nums">
              {cur.knobs.pool.length} selected
            </span>
          </div>
          {QUALITY_GROUPS.map((group) => (
            <details
              key={group.title}
              className="group border-t border-ink-700/60 first:border-t-0"
              open={group.defaultOpen}
            >
              <summary className="cursor-pointer list-none py-3 font-sans text-[11px] uppercase tracking-[0.22em] text-paper-muted hover:text-paper flex items-center gap-2 select-none">
                <span className="transition-transform group-open:rotate-90 inline-block w-3 text-paper-faint">›</span>
                {group.title}
              </summary>
              <div className="pl-5 pb-3 space-y-3">
                {group.qualities.map((q) => (
                  <div key={q.suffix}>
                    <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-paper-faint mb-2">
                      {q.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PICKER_ROOTS.map((r) => {
                        const chord = `${r}${q.suffix}` as ChordName;
                        return (
                          <CheckboxChip
                            key={chord}
                            label={chord}
                            checked={cur.knobs.pool.includes(chord)}
                            onChange={() => togglePool(chord)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
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
    <Section title="guitar · chord progression" subtitle="name the changes">
      <LevelSegments current={cur.level} onChange={setLevel} />

      <Disclosure summary="fine-tune">
        <KnobRow
          label="length"
          help="How many chords play in each progression. Longer = more to track and identify in order."
        >
          <ToggleGroup
            value={String(cur.knobs.length)}
            onChange={(v) => setKnob('length', Number(v) as 3 | 4)}
            options={[['3', '3 chords'], ['4', '4 chords']]}
          />
        </KnobRow>
        <KnobRow
          label="tempo"
          help="Playback speed. Slow gives time to label each chord; fast forces quicker recognition."
        >
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
        <KnobRow
          label="colour"
          help={
            <>
              How each Roman numeral is voiced. The progression shape stays the
              same — only the harmonic flavour changes.
              <br /><br />
              <strong className="text-paper">triads</strong>: plain major/minor only.{' '}
              <strong className="text-paper">+V7</strong>: dominant gets a 7th.{' '}
              <strong className="text-paper">diatonic 7ths</strong>: every chord becomes its diatonic 7th.{' '}
              <strong className="text-paper">extensions</strong>: sprinkles 9ths and 13ths.{' '}
              <strong className="text-paper">altered</strong>: dominant gains tensions like 7b9 / 7#9.
            </>
          }
        >
          <Select
            value={cur.knobs.qualityScheme ?? 'triads'}
            onChange={(v) => setKnob('qualityScheme', v as QualityScheme)}
            options={[
              ['triads',         'triads only'],
              ['triads+V7',      'triads + V7'],
              ['diatonic-7ths',  'diatonic 7ths'],
              ['extensions',     'extensions (9 / 13)'],
              ['altered',        'altered (b9 / #9)'],
            ]}
          />
        </KnobRow>
        <KnobRow
          label="pool"
          help="Which Roman numerals can appear. I (the tonic) is always required and anchors every progression. Adding numerals widens the harmonic vocabulary."
        >
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
    <details className="group rounded-lg border border-ink-700 bg-ink-850/40">
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
  help,
  children,
}: {
  label: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <KnobLabel help={help}>{label}</KnobLabel>
      <div className="flex-1 sm:max-w-md">{children}</div>
    </div>
  );
}

function KnobLabel({
  children,
  help,
}: {
  children: ReactNode;
  help?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 min-w-20">
      <span className="font-sans text-xs uppercase tracking-[0.22em] text-paper-faint">
        {children}
      </span>
      {help && <HelpTip>{help}</HelpTip>}
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

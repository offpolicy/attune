import { ModeCard } from '../components/ModeCard';
import {
  navigateHome,
  navigateToMode,
  navigateToSettings,
} from '../lib/route';
import { useStats } from '../state/stats';
import { useSettings } from '../state/settings';
import { levelLabel } from '../exercises/levels';
import {
  IMPLEMENTED_MODES,
  modeId,
  type Activity,
  type Instrument,
  type Mode,
} from '../types';
import type { ModeStats } from '../state/stats';
import type { Settings } from '../state/settings';

const ORDINALS = ['i.', 'ii.', 'iii.'];

const ACTIVITIES: { activity: Activity; title: string; subtitle: string }[] = [
  { activity: 'note',  title: 'single note',       subtitle: 'name the note'    },
  { activity: 'chord', title: 'single chord',      subtitle: 'name the chord'   },
  { activity: 'prog',  title: 'chord progression', subtitle: 'name the changes' },
];

const INSTRUMENT_TITLE: Record<Instrument, string> = {
  piano: 'piano',
  guitar: 'guitar',
};

function settingsKeyFor(mode: Mode): keyof Settings {
  switch (mode) {
    case 'piano-note':   return 'pianoNote';
    case 'piano-chord':  return 'pianoChord';
    case 'piano-prog':   return 'pianoProg';
    case 'guitar-note':  return 'guitarNote';
    case 'guitar-chord': return 'guitarChord';
    case 'guitar-prog':  return 'guitarProg';
  }
}

function formatStats(s: ModeStats): string {
  const best = s.bestPct > 0 ? `best ${Math.round(s.bestPct)}%` : 'best —';
  const streak = s.streakDays > 0 ? `streak ${s.streakDays}` : null;
  return [best, streak].filter(Boolean).join(' · ');
}

export function InstrumentPage({ instrument }: { instrument: Instrument }) {
  const { stats } = useStats();
  const { settings } = useSettings();

  return (
    <main className="mx-auto max-w-2xl px-6 pt-8 pb-24">
      <header className="mb-12 flex items-center justify-between">
        <button
          onClick={navigateHome}
          aria-label="back"
          className="text-paper-muted hover:text-paper transition-colors text-2xl px-2 -ml-2"
        >
          ←
        </button>
        <p className="font-display text-lg">{INSTRUMENT_TITLE[instrument]}</p>
        <button
          onClick={navigateToSettings}
          aria-label="settings"
          className="text-paper-muted hover:text-paper transition-colors text-xl px-2 -mr-2"
        >
          ⚙
        </button>
      </header>

      <p className="mb-6 font-sans text-xs uppercase tracking-[0.18em] text-paper-faint">
        pick a mode
      </p>

      <section className="space-y-3">
        {ACTIVITIES.map((card, i) => {
          const mode = modeId(instrument, card.activity);
          const implemented = IMPLEMENTED_MODES.has(mode);
          const settingsKey = settingsKeyFor(mode);
          const modeStats = stats[mode];
          const level = settings[settingsKey].level;

          const statLine = implemented
            ? `level ${level === 'custom' ? '·' : level} · ${levelLabel(level)} · ${formatStats(modeStats)}`
            : 'coming soon';

          return (
            <ModeCard
              key={card.activity}
              ordinal={ORDINALS[i]!}
              title={card.title}
              subtitle={card.subtitle}
              statLine={statLine}
              disabled={!implemented}
              onClick={implemented ? () => navigateToMode(mode) : undefined}
            />
          );
        })}
      </section>
    </main>
  );
}

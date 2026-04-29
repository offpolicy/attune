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
  ACTIVITY_PROMPT,
  ACTIVITY_TITLE,
  INSTRUMENT_ACTIVITIES,
  modeId,
  type Activity,
  type Instrument,
  type Mode,
} from '../types';
import type { ModeStats } from '../state/stats';
import type { Settings } from '../state/settings';

const ORDINALS = ['i.', 'ii.', 'iii.'];

const INSTRUMENT_TITLE: Record<Instrument, string> = {
  piano:  'piano',
  guitar: 'guitar',
  bass:   'bass',
};

// Maps a Mode id to its persisted-settings key. The matrix is ragged, so
// not every (instrument, activity) pair has an entry — this only handles
// the implemented cells.
function settingsKeyFor(mode: Mode): keyof Settings {
  switch (mode) {
    case 'piano-note':   return 'pianoNote';
    case 'piano-chord':  return 'pianoChord';
    case 'piano-prog':   return 'pianoProg';
    case 'guitar-note':  return 'guitarNote';
    case 'guitar-chord': return 'guitarChord';
    case 'guitar-prog':  return 'guitarProg';
    case 'bass-note':    return 'bassNote';
    case 'bass-roots':   return 'bassRoots';
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

  const activities: Activity[] = INSTRUMENT_ACTIVITIES[instrument];

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
        {activities.map((activity, i) => {
          const mode = modeId(instrument, activity);
          // The activity list comes from INSTRUMENT_ACTIVITIES[instrument],
          // which only contains valid (implemented) pairs — modeId is non-null.
          if (mode == null) return null;
          const settingsKey = settingsKeyFor(mode);
          const modeStats = stats[mode];
          const level = settings[settingsKey].level;
          const statLine = `level ${level === 'custom' ? '·' : level} · ${levelLabel(level)} · ${formatStats(modeStats)}`;

          return (
            <ModeCard
              key={activity}
              ordinal={ORDINALS[i]!}
              title={ACTIVITY_TITLE[activity]}
              subtitle={ACTIVITY_PROMPT[activity]}
              statLine={statLine}
              onClick={() => navigateToMode(mode)}
            />
          );
        })}
      </section>
    </main>
  );
}

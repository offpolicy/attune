import { useStats } from '../state/stats';
import { useSettings } from '../state/settings';
import { ModeCard } from '../components/ModeCard';
import { navigateToMode } from '../lib/route';
import { levelLabel } from '../exercises/levels';
import type { Mode } from '../types';
import type { ModeStats } from '../state/stats';
import type { Settings } from '../state/settings';

const ORDINALS = ['i.', 'ii.', 'iii.'];

function settingsKeyFor(mode: Mode): keyof Settings {
  switch (mode) {
    case 'piano-note':   return 'pianoNote';
    case 'guitar-chord': return 'guitarChord';
    case 'guitar-prog':  return 'guitarProg';
  }
}

function formatStats(s: ModeStats): string {
  const best = s.bestPct > 0 ? `best ${Math.round(s.bestPct)}%` : 'best —';
  const streak = s.streakDays > 0 ? `streak ${s.streakDays}` : null;
  return [best, streak].filter(Boolean).join(' · ');
}

const CARDS: { mode: Mode; title: string; subtitle: string; ready: boolean }[] = [
  { mode: 'piano-note',   title: 'piano',  subtitle: 'name the note',    ready: true  },
  { mode: 'guitar-chord', title: 'guitar', subtitle: 'name the chord',   ready: false },
  { mode: 'guitar-prog',  title: 'guitar', subtitle: 'name the changes', ready: false },
];

export function Home() {
  const { stats } = useStats();
  const { settings } = useSettings();

  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-24 sm:pt-24">
      <header className="mb-12">
        <h1
          className="font-display font-semibold leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
        >
          attune<span className="text-lamp-400">.</span>
        </h1>
        <p className="mt-3 font-display italic text-paper-muted">
          a pitch ear-training service
        </p>
      </header>

      <section className="space-y-3">
        {CARDS.map((card, i) => {
          const modeStats = stats[card.mode];
          const level = settings[settingsKeyFor(card.mode)].level;
          const statLine = card.ready
            ? `level ${level === 'custom' ? '·' : level} · ${levelLabel(level)} · ${formatStats(modeStats)}`
            : 'coming next';
          return (
            <ModeCard
              key={card.mode}
              ordinal={ORDINALS[i]!}
              title={card.title}
              subtitle={card.subtitle}
              statLine={statLine}
              disabled={!card.ready}
              onClick={() => navigateToMode(card.mode)}
            />
          );
        })}
      </section>
    </main>
  );
}

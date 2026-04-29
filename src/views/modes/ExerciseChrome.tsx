import { navigateHome, navigateToSettings } from '../../lib/route';
import { levelLabel } from '../../exercises/levels';
import type { Level } from '../../state/settings';
import type { ModeStats } from '../../state/stats';

export function ExerciseHeader({
  title,
  level,
}: {
  title: string;
  level: Level;
}) {
  return (
    <header className="mb-12 flex items-center justify-between">
      <button
        onClick={navigateHome}
        aria-label="back"
        className="text-paper-muted hover:text-paper transition-colors text-2xl px-2 -ml-2"
      >
        ←
      </button>
      <div className="text-center">
        <p className="font-display text-lg">{title}</p>
        <p className="font-sans text-xs uppercase tracking-[0.18em] text-paper-faint mt-1">
          level {level === 'custom' ? '·' : level} · {levelLabel(level)}
        </p>
      </div>
      <button
        onClick={navigateToSettings}
        aria-label="settings"
        className="text-paper-muted hover:text-paper transition-colors text-xl px-2 -mr-2"
      >
        ⚙
      </button>
    </header>
  );
}

export function ExerciseFooter({
  takeNumber,
  modeStats,
}: {
  takeNumber: number;
  modeStats: ModeStats;
}) {
  const todayPct =
    modeStats.today.total > 0
      ? Math.round((modeStats.today.correct / modeStats.today.total) * 100)
      : 0;
  return (
    <footer className="mt-12 text-center font-sans text-xs uppercase tracking-[0.18em] text-paper-faint tabular-nums">
      take {takeNumber} · streak {modeStats.streakDays} ·{' '}
      {modeStats.today.correct}/{modeStats.today.total} · {todayPct}%
    </footer>
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import type { Mode } from '../types';

export type ModeStats = {
  bestPct: number;
  streakDays: number;
  lastPlayedISO: string;
  today: { correct: number; total: number; dateISO: string };
};

export type Stats = Record<Mode, ModeStats>;

const STORAGE_KEY = 'attune:stats:v1';

const EMPTY: ModeStats = {
  bestPct: 0,
  streakDays: 0,
  lastPlayedISO: '',
  today: { correct: 0, total: 0, dateISO: '' },
};

export const DEFAULT_STATS: Stats = {
  'piano-note': structuredClone(EMPTY),
  'guitar-chord': structuredClone(EMPTY),
  'guitar-prog': structuredClone(EMPTY),
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function isoMinusOneDay(iso: string): string {
  if (!iso) return iso;
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function recordTake(s: ModeStats, correct: boolean): ModeStats {
  const today = todayISO();
  let cur = s;

  if (cur.today.dateISO !== today) {
    const yesterday = isoMinusOneDay(today);
    const streakContinues = cur.lastPlayedISO === yesterday;
    cur = {
      ...cur,
      streakDays: streakContinues ? cur.streakDays : 0,
      today: { correct: 0, total: 0, dateISO: today },
    };
  }

  const newTotal = cur.today.total + 1;
  const newCorrect = cur.today.correct + (correct ? 1 : 0);
  const wasFirstCorrectOfDay = correct && cur.today.correct === 0;

  let newBestPct = cur.bestPct;
  if (newTotal >= 10) {
    const pct = (newCorrect / newTotal) * 100;
    if (pct > newBestPct) newBestPct = pct;
  }

  return {
    bestPct: newBestPct,
    streakDays: wasFirstCorrectOfDay ? cur.streakDays + 1 : cur.streakDays,
    lastPlayedISO: wasFirstCorrectOfDay ? today : cur.lastPlayedISO,
    today: { correct: newCorrect, total: newTotal, dateISO: today },
  };
}

type StatsCtx = {
  stats: Stats;
  recordTakeFor: (mode: Mode, correct: boolean) => void;
  reset: () => void;
};

const StatsContext = createContext<StatsCtx | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats>(() => {
    const persisted = readJSON<Partial<Stats>>(STORAGE_KEY, {});
    return {
      'piano-note': persisted['piano-note'] ?? structuredClone(EMPTY),
      'guitar-chord': persisted['guitar-chord'] ?? structuredClone(EMPTY),
      'guitar-prog': persisted['guitar-prog'] ?? structuredClone(EMPTY),
    };
  });

  useEffect(() => {
    writeJSON(STORAGE_KEY, stats);
  }, [stats]);

  const recordTakeFor = useCallback((mode: Mode, correct: boolean) => {
    setStats((prev) => ({ ...prev, [mode]: recordTake(prev[mode], correct) }));
  }, []);

  const reset = useCallback(() => {
    setStats(structuredClone(DEFAULT_STATS));
  }, []);

  return (
    <StatsContext.Provider value={{ stats, recordTakeFor, reset }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats(): StatsCtx {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats called outside StatsProvider');
  return ctx;
}

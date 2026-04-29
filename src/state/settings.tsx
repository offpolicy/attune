import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import type { Midi } from '../audio/theory';

export type Level = 1 | 2 | 3 | 4 | 5 | 'custom';
export type ReferencePolicy = 'every' | 'first' | 'never';

export type PianoNoteKnobs = {
  pool: 'tonic-triad' | 'diatonic' | 'diatonic+accidentals' | 'chromatic';
  reference: ReferencePolicy;
  range: [Midi, Midi];
  labels: 'solfege' | 'numeric';
};

export type GuitarChordKnobs = {
  pool: string[];
  voicing: 'fixed' | 'varied';
};

export type GuitarProgKnobs = {
  key: string;
  length: 3 | 4;
  pool: string[];
  tempo: 'slow' | 'medium' | 'fast';
  showRoman: boolean;
};

export type Settings = {
  pianoNote: { level: Level; knobs: PianoNoteKnobs };
  guitarChord: { level: Level; knobs: GuitarChordKnobs };
  guitarProg: { level: Level; knobs: GuitarProgKnobs };
};

const STORAGE_KEY = 'attune:settings:v1';

export const DEFAULT_SETTINGS: Settings = {
  pianoNote: {
    level: 1,
    knobs: {
      pool: 'tonic-triad',
      reference: 'every',
      range: [60, 72],
      labels: 'solfege',
    },
  },
  guitarChord: {
    level: 1,
    knobs: { pool: ['C', 'Am', 'F', 'G'], voicing: 'fixed' },
  },
  guitarProg: {
    level: 1,
    knobs: {
      key: 'C',
      length: 3,
      pool: ['I', 'IV', 'V'],
      tempo: 'medium',
      showRoman: false,
    },
  },
};

type SettingsCtx = {
  settings: Settings;
  setSettings: (next: Settings) => void;
};

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    readJSON(STORAGE_KEY, DEFAULT_SETTINGS),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEY, settings);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings called outside SettingsProvider');
  return ctx;
}

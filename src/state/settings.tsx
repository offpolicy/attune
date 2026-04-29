import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { readJSON, writeJSON } from '../lib/storage';
import type { Midi } from '../audio/theory';
import type { ChordName, ProgKey, Roman } from '../exercises/chords';
import type { QualityScheme } from '../exercises/progressionTemplates';

export type Level = 1 | 2 | 3 | 4 | 5 | 'custom';

export type PianoNoteKnobs = {
  pool: 'tonic-triad' | 'diatonic' | 'diatonic+accidentals' | 'chromatic';
  range: [Midi, Midi];
  labels: 'solfege' | 'numeric';
};

export type GuitarChordKnobs = {
  pool: ChordName[];
  voicing: 'fixed' | 'varied';
};

export type GuitarProgKnobs = {
  key: ProgKey;
  length: 3 | 4;
  pool: Roman[];
  tempo: 'slow' | 'medium' | 'fast';
  qualityScheme: QualityScheme;
  showRoman: boolean;
};

// Note/chord/progression knob types are reused per instrument in v1; the same
// shape serves both piano-note and guitar-note (etc.). Specialization can come
// later if a per-instrument knob diverges.
export type Settings = {
  pianoNote:   { level: Level; knobs: PianoNoteKnobs };
  pianoChord:  { level: Level; knobs: GuitarChordKnobs };
  pianoProg:   { level: Level; knobs: GuitarProgKnobs };
  guitarNote:  { level: Level; knobs: PianoNoteKnobs };
  guitarChord: { level: Level; knobs: GuitarChordKnobs };
  guitarProg:  { level: Level; knobs: GuitarProgKnobs };
};

const STORAGE_KEY = 'attune:settings:v1';

const DEFAULT_NOTE_KNOBS: PianoNoteKnobs = {
  pool: 'tonic-triad',
  range: [60, 72],
  labels: 'solfege',
};

const DEFAULT_CHORD_KNOBS: GuitarChordKnobs = {
  pool: ['C', 'Am', 'F', 'G'],
  voicing: 'fixed',
};

const DEFAULT_PROG_KNOBS: GuitarProgKnobs = {
  key: 'C',
  length: 3,
  pool: ['I', 'IV', 'V'],
  tempo: 'slow',
  qualityScheme: 'triads',
  showRoman: false,
};

export const DEFAULT_SETTINGS: Settings = {
  pianoNote:   { level: 1, knobs: { ...DEFAULT_NOTE_KNOBS } },
  pianoChord:  { level: 1, knobs: structuredClone(DEFAULT_CHORD_KNOBS) },
  pianoProg:   { level: 1, knobs: structuredClone(DEFAULT_PROG_KNOBS) },
  guitarNote:  { level: 1, knobs: { ...DEFAULT_NOTE_KNOBS } },
  guitarChord: { level: 1, knobs: structuredClone(DEFAULT_CHORD_KNOBS) },
  guitarProg:  { level: 1, knobs: structuredClone(DEFAULT_PROG_KNOBS) },
};

type SettingsCtx = {
  settings: Settings;
  setSettings: (next: Settings) => void;
};

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const persisted = readJSON<Partial<Settings>>(STORAGE_KEY, {});
    // Hydrate per-key so settings persisted before the matrix expansion still
    // load (3 keys → 6 keys); missing keys fall back to defaults.
    return {
      pianoNote:   persisted.pianoNote   ?? DEFAULT_SETTINGS.pianoNote,
      pianoChord:  persisted.pianoChord  ?? DEFAULT_SETTINGS.pianoChord,
      pianoProg:   persisted.pianoProg   ?? DEFAULT_SETTINGS.pianoProg,
      guitarNote:  persisted.guitarNote  ?? DEFAULT_SETTINGS.guitarNote,
      guitarChord: persisted.guitarChord ?? DEFAULT_SETTINGS.guitarChord,
      guitarProg:  persisted.guitarProg  ?? DEFAULT_SETTINGS.guitarProg,
    };
  });

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

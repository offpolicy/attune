export type Instrument = 'piano' | 'guitar' | 'bass';
export type Activity = 'note' | 'chord' | 'prog' | 'roots';

// Ragged matrix: not every (instrument, activity) pair is valid. Bass skips
// `chord` (bass doesn't play chords in the strummed/block sense) and gains
// `roots` instead — identifying the root motion of a chord progression
// (display label: "bassline").
export type Mode =
  | 'piano-note'
  | 'piano-chord'
  | 'piano-prog'
  | 'guitar-note'
  | 'guitar-chord'
  | 'guitar-prog'
  | 'bass-note'
  | 'bass-roots';

export const ALL_INSTRUMENTS: readonly Instrument[] = ['piano', 'guitar', 'bass'];
export const ALL_ACTIVITIES: readonly Activity[] = ['note', 'chord', 'prog', 'roots'];

// Each instrument's mode picker iterates this list to render its cards.
export const INSTRUMENT_ACTIVITIES: Record<Instrument, Activity[]> = {
  piano:  ['note', 'chord', 'prog'],
  guitar: ['note', 'chord', 'prog'],
  bass:   ['note', 'roots'],
};

export const IMPLEMENTED_MODES = new Set<Mode>([
  'piano-note',
  'piano-chord',
  'piano-prog',
  'guitar-note',
  'guitar-chord',
  'guitar-prog',
  'bass-note',
  'bass-roots',
]);

export function isInstrument(s: string): s is Instrument {
  return s === 'piano' || s === 'guitar' || s === 'bass';
}

export function isActivity(s: string): s is Activity {
  return s === 'note' || s === 'chord' || s === 'prog' || s === 'roots';
}

// Construct a Mode id from an instrument + activity. Returns null if the
// pair isn't in the ragged matrix (e.g. bass + chord).
export function modeId(instrument: Instrument, activity: Activity): Mode | null {
  const id = `${instrument}-${activity}` as Mode;
  return IMPLEMENTED_MODES.has(id) ? id : null;
}

export function splitMode(mode: Mode): {
  instrument: Instrument;
  activity: Activity;
} {
  const [instrument, activity] = mode.split('-') as [Instrument, Activity];
  return { instrument, activity };
}

// Display label for an activity (the picker subtitle uses italic prompts elsewhere).
export const ACTIVITY_TITLE: Record<Activity, string> = {
  note:   'single note',
  chord:  'single chord',
  prog:   'chord progression',
  roots:  'bassline',
};

export const ACTIVITY_PROMPT: Record<Activity, string> = {
  note:   'name the note',
  chord:  'name the chord',
  prog:   'name the changes',
  roots:  'name the bassline',
};

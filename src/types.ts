export type Instrument = 'piano' | 'guitar';
export type Activity = 'note' | 'chord' | 'prog';
export type Mode = `${Instrument}-${Activity}`;

export const ALL_INSTRUMENTS: readonly Instrument[] = ['piano', 'guitar'];
export const ALL_ACTIVITIES: readonly Activity[] = ['note', 'chord', 'prog'];

// v1 ships these three; the other three (piano-chord, piano-prog, guitar-note)
// are placeholders in the picker matrix.
export const IMPLEMENTED_MODES = new Set<Mode>([
  'piano-note',
  'guitar-chord',
  'guitar-prog',
]);

export function isInstrument(s: string): s is Instrument {
  return s === 'piano' || s === 'guitar';
}

export function isActivity(s: string): s is Activity {
  return s === 'note' || s === 'chord' || s === 'prog';
}

export function modeId(instrument: Instrument, activity: Activity): Mode {
  return `${instrument}-${activity}`;
}

export function splitMode(mode: Mode): {
  instrument: Instrument;
  activity: Activity;
} {
  const [instrument, activity] = mode.split('-') as [Instrument, Activity];
  return { instrument, activity };
}

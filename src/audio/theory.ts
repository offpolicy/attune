export type NoteName = string;
export type Midi = number;
export type PitchClass =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

const NOTE_NAME_TO_PC: Record<string, PitchClass> = {
  C: 0,  'C#': 1,  Db: 1,
  D: 2,  'D#': 3,  Eb: 3,
  E: 4,
  F: 5,  'F#': 6,  Gb: 6,
  G: 7,  'G#': 8,  Ab: 8,
  A: 9,  'A#': 10, Bb: 10,
  B: 11,
};

const PC_TO_SHARP_NAME: readonly string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

const NOTE_PATTERN = /^([A-G])([#b]?)(-?\d+)$/;

export function noteToMidi(note: NoteName): Midi {
  const m = NOTE_PATTERN.exec(note);
  if (!m) throw new Error(`Invalid note name: ${note}`);
  const [, letter, accidental, octStr] = m;
  const pc = NOTE_NAME_TO_PC[letter + accidental];
  if (pc === undefined) throw new Error(`Invalid note name: ${note}`);
  return (parseInt(octStr, 10) + 1) * 12 + pc;
}

export function midiToNote(midi: Midi): NoteName {
  const pc = ((midi % 12) + 12) % 12;
  const oct = Math.floor(midi / 12) - 1;
  return PC_TO_SHARP_NAME[pc] + String(oct);
}

export function pitchClass(midi: Midi): PitchClass {
  return (((midi % 12) + 12) % 12) as PitchClass;
}

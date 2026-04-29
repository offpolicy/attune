import { Soundfont } from 'smplr';

export type InstrumentName = 'piano' | 'guitar' | 'bass';

const GM_INSTRUMENTS: Record<InstrumentName, string> = {
  piano: 'acoustic_grand_piano',
  guitar: 'acoustic_guitar_steel',
  bass: 'electric_bass_finger',
};

let sharedContext: AudioContext | null = null;
const cache = new Map<InstrumentName, Promise<Soundfont>>();

export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

export async function unlockAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export function loadInstrument(name: InstrumentName): Promise<Soundfont> {
  const existing = cache.get(name);
  if (existing) return existing;

  const ctx = getAudioContext();
  const instr = new Soundfont(ctx, { instrument: GM_INSTRUMENTS[name] });
  const ready = instr.load.then(() => instr);
  cache.set(name, ready);
  return ready;
}

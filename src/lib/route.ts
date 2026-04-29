import { useEffect, useState } from 'react';
import {
  IMPLEMENTED_MODES,
  isActivity,
  isInstrument,
  modeId,
  splitMode,
  type Instrument,
  type Mode,
} from '../types';

export type Route =
  | { name: 'home' }
  | { name: 'instrument'; instrument: Instrument }
  | { name: 'exercise'; mode: Mode }
  | { name: 'settings' };

export function parseRoute(): Route {
  const hash = window.location.hash.slice(1);

  if (hash === '' || hash === '/') return { name: 'home' };
  if (hash === '/settings') return { name: 'settings' };

  // Legacy flat-id deep links: /piano-note, /guitar-chord, /guitar-prog
  const legacy = hash.match(/^\/(piano|guitar)-(note|chord|prog)$/);
  if (legacy) {
    const mode = `${legacy[1]}-${legacy[2]}` as Mode;
    if (IMPLEMENTED_MODES.has(mode)) return { name: 'exercise', mode };
  }

  const segs = hash.split('/').filter(Boolean);

  if (segs.length === 1 && isInstrument(segs[0]!)) {
    return { name: 'instrument', instrument: segs[0]! };
  }

  if (segs.length === 2 && isInstrument(segs[0]!) && isActivity(segs[1]!)) {
    const mode = modeId(segs[0]!, segs[1]!);
    if (IMPLEMENTED_MODES.has(mode)) return { name: 'exercise', mode };
    // Unimplemented matrix cell: drop the user back at the instrument's mode picker.
    return { name: 'instrument', instrument: segs[0]! };
  }

  return { name: 'home' };
}

export function navigateHome(): void {
  if (window.location.hash) {
    history.pushState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

export function navigateToInstrument(instrument: Instrument): void {
  window.location.hash = '/' + instrument;
}

export function navigateToMode(mode: Mode): void {
  const { instrument, activity } = splitMode(mode);
  window.location.hash = `/${instrument}/${activity}`;
}

export function navigateToSettings(): void {
  window.location.hash = '/settings';
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const handler = () => setRoute(parseRoute());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

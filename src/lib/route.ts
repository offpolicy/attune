import { useEffect, useState } from 'react';
import type { Mode } from '../types';

export type Route =
  | { name: 'home' }
  | { name: 'exercise'; mode: Mode }
  | { name: 'settings' };

export function parseRoute(): Route {
  const hash = window.location.hash.slice(1);
  switch (hash) {
    case '':
    case '/':
      return { name: 'home' };
    case '/piano-note':
      return { name: 'exercise', mode: 'piano-note' };
    case '/guitar-chord':
      return { name: 'exercise', mode: 'guitar-chord' };
    case '/guitar-prog':
      return { name: 'exercise', mode: 'guitar-prog' };
    case '/settings':
      return { name: 'settings' };
    default:
      return { name: 'home' };
  }
}

export function navigateHome(): void {
  if (window.location.hash) {
    history.pushState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

export function navigateToMode(mode: Mode): void {
  window.location.hash = '/' + mode;
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

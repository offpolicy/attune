import { useEffect } from 'react';
import { useRoute } from './lib/route';
import { SettingsProvider } from './state/settings';
import { StatsProvider } from './state/stats';
import { Home } from './views/Home';
import { Exercise } from './views/Exercise';

export default function App() {
  const route = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  let view;
  switch (route.name) {
    case 'home':
      view = <Home />;
      break;
    case 'exercise':
      view = <Exercise mode={route.mode} />;
      break;
    case 'settings':
      // M3 will build this; for now fall through to home.
      view = <Home />;
      break;
  }

  return (
    <SettingsProvider>
      <StatsProvider>
        <div className="min-h-svh bg-ink-900 text-paper">{view}</div>
      </StatsProvider>
    </SettingsProvider>
  );
}

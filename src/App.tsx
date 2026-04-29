import { useEffect } from 'react';
import { useRoute } from './lib/route';
import { SettingsProvider } from './state/settings';
import { StatsProvider } from './state/stats';
import { Home } from './views/Home';
import { InstrumentPage } from './views/InstrumentPage';
import { Exercise } from './views/Exercise';
import { SettingsView } from './views/Settings';

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
    case 'instrument':
      view = <InstrumentPage instrument={route.instrument} />;
      break;
    case 'exercise':
      view = <Exercise mode={route.mode} />;
      break;
    case 'settings':
      view = <SettingsView />;
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

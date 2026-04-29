import { ModeCard } from '../components/ModeCard';
import { navigateToInstrument, navigateToSettings } from '../lib/route';
import type { Instrument } from '../types';

const ORDINALS = ['i.', 'ii.'];

const INSTRUMENTS: { instrument: Instrument; title: string; subtitle: string }[] = [
  { instrument: 'piano',  title: 'piano',  subtitle: 'keyboard exercises'  },
  { instrument: 'guitar', title: 'guitar', subtitle: 'fretboard exercises' },
];

export function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-24 sm:pt-24 relative">
      <button
        onClick={navigateToSettings}
        aria-label="settings"
        className="absolute top-6 right-6 text-paper-muted hover:text-paper transition-colors text-xl"
      >
        ⚙
      </button>
      <header className="mb-12">
        <h1
          className="font-display font-semibold leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
        >
          attune<span className="text-lamp-400">.</span>
        </h1>
        <p className="mt-3 font-display italic text-paper-muted">
          a pitch ear-training service
        </p>
      </header>

      <p className="mb-6 font-sans text-xs uppercase tracking-[0.18em] text-paper-faint">
        pick your instrument
      </p>

      <section className="space-y-3">
        {INSTRUMENTS.map((card, i) => (
          <ModeCard
            key={card.instrument}
            ordinal={ORDINALS[i]!}
            title={card.title}
            subtitle={card.subtitle}
            statLine=""
            onClick={() => navigateToInstrument(card.instrument)}
          />
        ))}
      </section>
    </main>
  );
}

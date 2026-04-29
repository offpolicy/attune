export default function App() {
  return (
    <main className="min-h-svh bg-ink-900 text-paper">
      <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <div className="flex items-center gap-3 font-sans text-[11px] font-medium uppercase tracking-[0.32em] text-lamp-400">
          <span className="inline-block h-px w-8 bg-lamp-500/60" aria-hidden />
          <span>a pitch ear-training service</span>
        </div>

        <h1
          className="mt-10 font-display font-semibold leading-[0.95] tracking-tight"
          style={{ fontSize: 'clamp(3rem, 10vw, 6rem)' }}
        >
          attune<span className="text-lamp-400">.</span>
        </h1>

        <p className="mt-6 max-w-lg font-sans text-base leading-relaxed text-paper-muted sm:text-lg">
          name the note. name the chord. <span className="italic text-paper">name the changes.</span>
        </p>

        <div className="mt-16 flex items-center gap-3 font-sans text-sm text-paper-muted">
          <span className="font-display italic text-paper">scaffold</span>
          <span aria-hidden className="text-paper-faint">│</span>
          <span>M0 — staging the room</span>
          <span aria-hidden className="text-paper-faint">│</span>
          <span className="font-display text-paper-faint">C♯ B♭ ♮</span>
        </div>
      </div>
    </main>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function HelpTip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="help"
        aria-expanded={open}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-ink-700 text-paper-faint hover:text-paper hover:border-paper-faint font-sans text-[11px] leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
      >
        ?
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute z-20 top-full mt-2 left-0 w-60 max-w-[calc(100vw-2rem)] p-3 rounded-md bg-ink-850 border border-ink-700 shadow-lg font-sans text-xs text-paper-muted leading-relaxed"
        >
          {children}
        </div>
      )}
    </div>
  );
}

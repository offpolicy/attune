import type { MouseEventHandler } from 'react';

type Props = {
  ordinal: string;
  title: string;
  subtitle: string;
  statLine: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function ModeCard({
  ordinal,
  title,
  subtitle,
  statLine,
  disabled = false,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group block w-full text-left rounded-2xl border border-ink-700 bg-ink-850 p-6 transition-colors hover:border-lamp-400/30 hover:bg-ink-800 disabled:hover:border-ink-700 disabled:hover:bg-ink-850 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
    >
      <div className="flex items-baseline gap-3">
        <span className="font-display italic text-paper-faint text-sm w-7 shrink-0">
          {ordinal}
        </span>
        <span className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </span>
      </div>
      <p className="mt-1 ml-10 font-display italic text-paper-muted">
        {subtitle}
      </p>
      <p className="mt-4 ml-10 font-sans text-xs uppercase tracking-[0.18em] text-paper-faint tabular-nums">
        {statLine}
      </p>
    </button>
  );
}

import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  selected?: boolean;
  flash?: 'wrong' | null;
};

export function AnswerChip({
  label,
  selected = false,
  flash,
  className = '',
  ...rest
}: Props) {
  const base =
    'min-w-[3.5rem] h-11 px-4 rounded-md font-display text-base font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:opacity-40 disabled:cursor-not-allowed';
  const palette = selected
    ? 'bg-lamp-400 text-ink-950 border border-lamp-400'
    : flash === 'wrong'
    ? 'bg-transparent text-paper border border-paper-muted'
    : 'bg-transparent text-paper border border-ink-700 hover:border-lamp-400/60';

  return (
    <button className={`${base} ${palette} ${className}`} {...rest}>
      {label}
    </button>
  );
}

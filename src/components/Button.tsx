import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg font-sans text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-lamp-300 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:opacity-40 disabled:cursor-not-allowed';
  const palette =
    variant === 'primary'
      ? 'bg-lamp-400 text-ink-950 hover:bg-lamp-300 active:bg-lamp-500'
      : 'bg-transparent text-paper-muted border border-ink-700 hover:text-paper hover:border-paper-faint';

  return (
    <button className={`${base} ${palette} ${className}`} {...rest}>
      {children}
    </button>
  );
}

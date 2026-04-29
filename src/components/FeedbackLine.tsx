type Props = {
  state: 'idle' | 'correct' | 'wrong';
  answer?: string;
};

export function FeedbackLine({ state, answer }: Props) {
  if (state === 'idle') {
    return (
      <p className="font-sans text-base text-paper-faint min-h-6">&nbsp;</p>
    );
  }
  if (state === 'correct') {
    return (
      <p
        aria-live="polite"
        className="font-sans text-base text-paper min-h-6"
      >
        <span className="text-leaf-400 mr-2">✓</span>
        <span className="font-display">{answer}</span>
      </p>
    );
  }
  return (
    <p aria-live="polite" className="font-sans text-base text-paper min-h-6">
      <span className="text-paper-muted mr-2">✗</span>
      <span>it was </span>
      <span className="font-display">{answer}</span>
    </p>
  );
}

/**
 * Card — neutral white surface with the redesign's single elevation.
 *
 * Replaces the legacy `.glass-card` / `.premium-card` / `.neon-border`
 * patterns that are scattered through the feature folders. Use this
 * for grouping related content; do not nest cards inside cards.
 *
 * Padding can be turned off (`padded={false}`) when the caller needs a
 * full-bleed inner element such as a list or media block.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When false, removes the default inner padding so callers can use ListRow / media. */
  padded?: boolean;
  /** When true, the card renders as an interactive surface (hover + focus styles). */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded = true, interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white border border-slate-200 rounded-2xl shadow-sm',
        padded && 'p-4',
        interactive &&
          'transition-shadow hover:shadow-md focus-within:shadow-md cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

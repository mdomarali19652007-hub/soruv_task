/**
 * Card — surface primitive with three modern fintech variants.
 *
 *   - `glass`    (default) frosted translucent surface that layers over
 *                the body's mesh gradient. Used for the majority of
 *                cards in the app shell.
 *   - `solid`    plain white surface — for places where readability of
 *                dense content matters more than depth (long lists).
 *   - `gradient` brand indigo→violet gradient with white text. Reserved
 *                for hero / balance cards.
 *
 * `padded={false}` removes the default inner padding so callers can
 * use `ListRow` or media full-bleed.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from './cn';

export type CardVariant = 'glass' | 'solid' | 'gradient';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** When false, removes the default inner padding. */
  padded?: boolean;
  /** Hover/focus elevation when the card is interactive. */
  interactive?: boolean;
  /** Adds the brand glow for hero CTAs. Only meaningful for `gradient`. */
  glow?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  glass:
    'bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]',
  solid:
    'bg-white border border-slate-200 shadow-sm',
  gradient:
    'bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 text-white border border-white/10 shadow-[0_16px_40px_-12px_rgba(99,102,241,0.55)] overflow-hidden relative',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'glass',
    padded = true,
    interactive = false,
    glow = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl transition-all duration-300',
        VARIANT_CLASSES[variant],
        padded && 'p-5',
        interactive &&
          'hover:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.18)] focus-within:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.18)] cursor-pointer',
        variant === 'gradient' && glow && 'glow-violet',
        className,
      )}
      {...rest}
    >
      {variant === 'gradient' && (
        // Inner highlight — a subtle white sheen across the top of
        // gradient hero cards so they look like polished glass rather
        // than flat colour.
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl bg-gradient-to-b from-white/15 to-transparent"
        />
      )}
      {children}
    </div>
  );
});

/**
 * Button — primary UI primitive for the redesign.
 *
 * Variants:
 *   - `primary`   solid blue, used for the single most important action on a screen
 *   - `secondary` white surface + border, used for the second action
 *   - `ghost`     transparent, used for tertiary / inline actions
 *   - `danger`    solid red, used only for destructive confirmations
 *
 * Sizes default to `md` (44px tall — meets the WCAG / Android tap-target floor).
 *
 * The component renders a real `<button>` element so screen readers and
 * keyboard users get correct semantics for free. It also exposes a
 * `loading` flag that disables the button and shows a spinner without
 * the caller having to wire up its own state.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Primary uses the brand indigo→violet gradient with a soft glow so
  // the CTA visibly "lifts" off the glass background. Active state
  // dampens the glow rather than darkening the gradient — feels more
  // tactile on a phone screen.
  //
  // The `sheen-host` class adds a one-shot diagonal light sweep on
  // hover for a touch of playfulness without animating constantly.
  primary:
    'sheen-host bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 bg-[length:160%_160%] text-white glow-primary hover:bg-[position:100%_50%] hover:-translate-y-0.5 hover:glow-violet active:translate-y-0 active:scale-[0.97] disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0',
  // Secondary is a frosted-glass surface so it harmonises with `Card`
  // primitives sitting on the same screen.
  secondary:
    'bg-white/70 backdrop-blur-md text-slate-900 border border-white/60 shadow-sm hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:bg-white active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0',
  ghost:
    'bg-transparent text-slate-700 hover:bg-white/60 hover:scale-[1.02] active:bg-white/80 active:scale-[0.98] disabled:text-slate-300 disabled:hover:scale-100',
  danger:
    'sheen-host bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_8px_24px_-6px_rgba(239,68,68,0.45)] hover:from-rose-500 hover:to-rose-600 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(239,68,68,0.55)] active:translate-y-0 active:scale-[0.97] disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-base gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold select-none',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0 inline-flex">{leftIcon}</span>
      )}
      {children && <span className="truncate">{children}</span>}
      {!loading && rightIcon && <span className="shrink-0 inline-flex">{rightIcon}</span>}
    </button>
  );
});

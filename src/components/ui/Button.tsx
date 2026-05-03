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
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300',
  secondary:
    'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
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
        'inline-flex items-center justify-center font-medium select-none',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
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

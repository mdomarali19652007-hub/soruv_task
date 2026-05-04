/**
 * BalancePill — compact currency display used in the top bar.
 *
 * Designed for the persistent shell described in the redesign plan
 * §3: the user always sees their main balance without having to
 * navigate to the wallet tab. Renders as a button when `onClick` is
 * provided so taps can deep-link to the wallet.
 */
import type { ReactNode } from 'react';
import { Wallet } from 'lucide-react';
import { cn } from './cn';

export interface BalancePillProps {
  /** Numeric balance. Formatted in the component using `Intl.NumberFormat`. */
  amount: number;
  /** ISO 4217 currency code or a plain symbol like "৳". Defaults to "৳". */
  currency?: string;
  /** Optional locale for number formatting. Defaults to `bn-BD`. */
  locale?: string;
  onClick?: () => void;
  className?: string;
  /** Override the leading icon. */
  icon?: ReactNode;
}

function formatAmount(amount: number, locale: string): string {
  // Use a plain number formatter and prepend the currency symbol so the
  // component works for the local "৳" symbol the same way it works for
  // a 3-letter ISO code, without `Intl` complaining about unknown
  // currencies on older Android WebViews.
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

export function BalancePill({
  amount,
  currency = '৳',
  locale = 'bn-BD',
  onClick,
  className,
  icon,
}: BalancePillProps) {
  const formatted = formatAmount(amount, locale);
  const baseClasses = cn(
    'group inline-flex items-center gap-2 px-3 h-10 rounded-full',
    'bg-white/70 backdrop-blur-md border border-white/60 shadow-sm',
    'text-sm font-semibold tabular-nums',
    className,
  );
  const content = (
    <>
      <span
        aria-hidden="true"
        className="inline-flex text-indigo-600 transition-transform duration-300 group-hover:[animation:ui-wiggle_0.6s_ease-in-out]"
      >
        {icon ?? <Wallet className="w-4 h-4" />}
      </span>
      <span className="gradient-text">
        {currency}
        {formatted}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          baseClasses,
          'transition-all duration-200 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
        )}
        aria-label={`Balance: ${currency}${formatted}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={baseClasses} aria-label={`Balance: ${currency}${formatted}`}>
      {content}
    </span>
  );
}

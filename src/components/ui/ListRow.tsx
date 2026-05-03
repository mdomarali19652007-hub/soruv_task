/**
 * ListRow — a single tappable row inside a `Card` or list container.
 *
 * Layout: [leading]  [title + subtitle]  [trailing]  [chevron?]
 *
 * Always renders as a `<button>` when `onClick` is provided so the
 * whole row (not just the chevron) is the tap target — important for
 * the 44x44px floor described in the redesign plan.
 */
import { forwardRef, type ReactNode, type HTMLAttributes, type Ref } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from './cn';

interface BaseProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Show a right-chevron affordance. Defaults to true when onClick is set. */
  showChevron?: boolean;
  className?: string;
}

interface ButtonRowProps extends BaseProps {
  onClick: () => void;
  disabled?: boolean;
  as?: 'button';
}

interface DivRowProps extends BaseProps {
  onClick?: undefined;
  as?: 'div';
}

export type ListRowProps = ButtonRowProps | DivRowProps;

export const ListRow = forwardRef<HTMLButtonElement | HTMLDivElement, ListRowProps>(
  function ListRow(props, ref) {
    const {
      leading,
      title,
      subtitle,
      trailing,
      showChevron,
      className,
    } = props;

    const inner = (
      <>
        {leading && <span className="shrink-0 inline-flex items-center">{leading}</span>}
        <span className="flex-1 min-w-0 text-left">
          <span className="block text-base font-medium text-slate-900 truncate">{title}</span>
          {subtitle && (
            <span className="block text-sm text-slate-600 truncate mt-0.5">{subtitle}</span>
          )}
        </span>
        {trailing && (
          <span className="shrink-0 inline-flex items-center text-sm text-slate-600">
            {trailing}
          </span>
        )}
        {(showChevron ?? Boolean(props.onClick)) && (
          <ChevronRight
            className="shrink-0 w-5 h-5 text-slate-400"
            aria-hidden="true"
          />
        )}
      </>
    );

    const baseClasses = cn(
      'w-full flex items-center gap-3 min-h-[44px] py-3 px-4 text-left',
      'border-b border-slate-100 last:border-b-0',
      className,
    );

    if (props.onClick) {
      return (
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          onClick={props.onClick}
          disabled={props.disabled}
          className={cn(
            baseClasses,
            'transition-colors hover:bg-slate-50 active:bg-slate-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {inner}
        </button>
      );
    }

    const { onClick: _ignored, as: _as, ...rest } = props as DivRowProps &
      HTMLAttributes<HTMLDivElement>;
    void _ignored;
    void _as;
    return (
      <div ref={ref as Ref<HTMLDivElement>} className={baseClasses} {...rest}>
        {inner}
      </div>
    );
  },
);

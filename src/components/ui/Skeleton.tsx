/**
 * Skeleton — neutral pulsing placeholder used while data is loading.
 *
 * The redesign plan rejects the legacy `.shimmer` keyframe (it ran an
 * infinite gradient sweep, expensive on mid-range Android). We use
 * Tailwind's built-in `animate-pulse` instead — it's cheap and
 * already respects `prefers-reduced-motion` via the user agent.
 */
import { cn } from './cn';

export interface SkeletonProps {
  className?: string;
  /** When true, renders as a perfect circle (avatars). */
  circle?: boolean;
}

export function Skeleton({ className, circle = false }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-slate-200 animate-pulse',
        circle ? 'rounded-full' : 'rounded-md',
        className,
      )}
    />
  );
}

/** Convenience: a stack of N text-sized skeleton bars. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i}>
          <Skeleton className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
        </div>
      ))}
    </div>
  );
}

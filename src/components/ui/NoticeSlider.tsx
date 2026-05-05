/**
 * NoticeSlider — auto-rotating notice ticker.
 *
 * Sits on top of the HomeView welcome banner. Rotates through the
 * provided `notices` (in either Bangla or English) with a soft
 * cross-fade + slide animation. Pauses while the user is hovering
 * over it. When `notices` is empty (or all rows are inactive) a
 * neutral fallback message is rendered so the slot is never blank.
 *
 * The component is purely presentational; the parent (HomeView /
 * App.tsx) is responsible for filtering inactive notices out and
 * sorting newest-first.
 */
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';
import type { Notice } from '../../types';

export interface NoticeSliderProps {
  notices: Notice[];
  /**
   * How long each notice stays on screen, in milliseconds.
   * Defaults to 5000 (5s) which feels comfortable for a marquee.
   */
  intervalMs?: number;
  /**
   * Fallback message rendered when `notices` is empty. Defaults to a
   * Bangla string; pass your own to localise.
   */
  emptyMessage?: string;
  className?: string;
}

export function NoticeSlider({
  notices,
  intervalMs = 5000,
  emptyMessage = 'এই মুহূর্তে কোনো নতুন নোটিশ নেই',
  className,
}: NoticeSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Reset to the first slide when the list shrinks.
  useEffect(() => {
    if (index >= notices.length) setIndex(0);
  }, [notices.length, index]);

  // Auto-advance.
  useEffect(() => {
    if (paused || notices.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % notices.length);
    }, Math.max(1500, intervalMs));
    return () => clearInterval(t);
  }, [paused, notices.length, intervalMs]);

  const isEmpty = notices.length === 0;
  const current = notices[index];

  const next = () => {
    if (notices.length === 0) return;
    setIndex((i) => (i + 1) % notices.length);
  };
  const prev = () => {
    if (notices.length === 0) return;
    setIndex((i) => (i - 1 + notices.length) % notices.length);
  };

  return (
    <div
      role="region"
      aria-label="notices"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'relative overflow-hidden rounded-2xl border shadow-sm',
        isEmpty
          ? 'bg-slate-50 border-slate-200 text-slate-500'
          : 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-amber-200 text-amber-900',
        'px-3 py-2.5',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg',
            isEmpty
              ? 'bg-slate-200 text-slate-500'
              : 'bg-amber-500 text-white shadow-sm',
          )}
          aria-hidden="true"
        >
          <Megaphone className="w-4 h-4" />
        </span>

        <div className="flex-1 min-w-0 relative h-5">
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 text-xs sm:text-sm font-medium truncate"
              >
                {emptyMessage}
              </motion.p>
            ) : (
              <motion.p
                key={current?.id ?? index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 text-xs sm:text-sm font-semibold truncate"
                lang={current?.language}
                dir="auto"
              >
                {current?.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Manual controls (only when there's more than one notice). */}
        {notices.length > 1 && (
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={prev}
              aria-label="পূর্ববর্তী নোটিশ"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="পরবর্তী নোটিশ"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dots indicator — only when multi-notice. */}
      {notices.length > 1 && (
        <div className="mt-1.5 flex items-center justify-center gap-1">
          {notices.map((n, i) => (
            <span
              key={n.id}
              aria-hidden="true"
              className={cn(
                'h-1 rounded-full transition-all',
                i === index ? 'w-4 bg-amber-500' : 'w-1.5 bg-amber-300/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Toast
 *
 * Lightweight in-app notification used to replace `alert()` for non-blocking
 * success/info/error feedback in the admin panel.
 *
 * Usage:
 *   const { toastUI, showToast } = useToast();
 *   ...
 *   showToast('Saved', 'success');
 *   // render `{toastUI}` once at the root of your component.
 *
 * Auto-dismisses after `durationMs` (default 3.5s). Multiple toasts stack
 * vertically. Click the toast to dismiss early. The component is fully
 * self-contained -- no portal -- and renders as a `fixed` overlay in the
 * top-right corner.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastEntry {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

const DEFAULT_DURATION_MS = 3500;
let nextToastId = 1;

export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info', durationMs: number = DEFAULT_DURATION_MS) => {
      const id = nextToastId++;
      setToasts(prev => [...prev, { id, message, variant, durationMs }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  // Cleanup on unmount.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const toastUI: ReactNode = (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[90vw] sm:max-w-sm pointer-events-none"
    >
      {toasts.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg border text-left transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${variantClass(t.variant)}`}
        >
          <span className="mt-0.5 shrink-0">{variantIcon(t.variant)}</span>
          <span className="text-[11px] font-bold leading-snug flex-1 break-words">
            {t.message}
          </span>
          <X className="w-3 h-3 mt-0.5 opacity-60 shrink-0" />
        </button>
      ))}
    </div>
  );

  return { showToast, dismiss, toastUI };
}

function variantClass(v: ToastVariant): string {
  switch (v) {
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'error':
      return 'bg-rose-50 border-rose-200 text-rose-700';
    default:
      return 'bg-indigo-50 border-indigo-200 text-indigo-700';
  }
}

function variantIcon(v: ToastVariant) {
  switch (v) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    default:
      return <Info className="w-4 h-4 text-indigo-500" />;
  }
}

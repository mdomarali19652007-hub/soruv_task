/**
 * Reusable async confirm/reason modal for admin actions.
 *
 * Replaces the native browser `prompt()` / `confirm()` calls that the
 * admin panel previously used for ban reasons, suspension durations,
 * rejection reasons, and similar flows. Native prompts are trivially
 * dismissible, easy to typo, hide behind tabs, and have inconsistent
 * UX across browsers. See the Admin Panel Audit and Remediation Plan,
 * §3 (Security / data hygiene flags) and §5 item 6.
 *
 * Usage:
 *
 *     const { requestReason, modalUI } = useReasonPrompt();
 *
 *     // imperative call inside an event handler:
 *     const reason = await requestReason({
 *       title: 'Reject Submission',
 *       inputLabel: 'Reason',
 *       confirmLabel: 'Reject',
 *       destructive: true,
 *     });
 *     if (reason === null) return; // user cancelled
 *
 *     // render the modal once, anywhere in the component tree:
 *     return <>{...; modalUI}</>;
 *
 * The hook serializes prompts naturally because `requestReason` only
 * stores one active prompt at a time. Callers should `await` the
 * promise; calling again before the previous prompt resolves will
 * cancel the previous one.
 */

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

export interface ReasonPromptOptions {
  /** Bold uppercase title shown at the top of the modal. */
  title: string;
  /** Optional subtitle / explanation under the title. */
  description?: string;
  /**
   * Label for the input. If omitted, the modal is render-only with no
   * text input (a pure confirm dialog) and `requestReason` resolves to
   * an empty string on confirm or `null` on cancel.
   */
  inputLabel?: string;
  inputPlaceholder?: string;
  inputType?: 'text' | 'number';
  /** Pre-filled value in the input. */
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in red instead of indigo. */
  destructive?: boolean;
  /** When true, requires non-empty input before confirm is allowed. */
  requireValue?: boolean;
}

interface PromptState extends ReasonPromptOptions {
  resolve: (value: string | null) => void;
}

export function useReasonPrompt() {
  const [active, setActive] = useState<PromptState | null>(null);
  const [value, setValue] = useState('');

  const requestReason = useCallback((opts: ReasonPromptOptions): Promise<string | null> => {
    setValue(opts.defaultValue ?? '');
    return new Promise<string | null>((resolve) => {
      setActive((prev) => {
        // If a prompt was already open, treat the new request as
        // cancelling the previous one to avoid leaking pending promises.
        prev?.resolve(null);
        return { ...opts, resolve };
      });
    });
  }, []);

  const handleConfirm = () => {
    if (!active) return;
    if (active.requireValue && !value.trim()) return;
    active.resolve(active.inputLabel === undefined ? '' : value);
    setActive(null);
  };

  const handleCancel = () => {
    if (!active) return;
    active.resolve(null);
    setActive(null);
  };

  const modalUI = active ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">
              {active.title}
            </h3>
            {active.description && (
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{active.description}</p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-700 -mt-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {active.inputLabel !== undefined && (
          <div className="space-y-2">
            {active.inputLabel && (
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {active.inputLabel}
              </label>
            )}
            <input
              type={active.inputType ?? 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={active.inputPlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') handleCancel();
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-bold outline-none focus:border-indigo-500"
            />
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            {active.cancelLabel ?? 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={active.requireValue && !value.trim()}
            className={`flex-1 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              active.destructive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {active.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { requestReason, modalUI };
}

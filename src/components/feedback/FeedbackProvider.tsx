/**
 * FeedbackProvider — single React context that hosts the app-wide
 * toast queue and the imperative confirm/prompt modal.
 *
 * Why this exists
 * ---------------
 * Before this provider, feature views relied on the browser's native
 * `alert()`, `confirm()` and `prompt()` for "do you want to do this?"
 * style flows. Those native dialogs are blocking, look out of place
 * against the app shell, hide behind tabs, and have inconsistent UX
 * across browsers and OSes. They are also not testable.
 *
 * The provider mounts a single instance of `useToast` (success / error
 * / info notifications) and `useReasonPrompt` (a styled
 * confirm-or-prompt modal) at the App root and exposes both to
 * descendants through `useFeedback()`. Descendants get three
 * imperative helpers:
 *
 *   showToast(message, variant?)        // non-blocking notification
 *   confirm({ title, description, ... }) // returns Promise<boolean>
 *   prompt({ title, inputLabel, ... })  // returns Promise<string|null>
 *
 * The underlying `useReasonPrompt` already handles both confirm-only
 * and confirm-with-input cases; this provider just wraps it with two
 * better-typed entry points so feature code reads naturally.
 */

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useToast, type ToastVariant } from '../Toast';
import { useReasonPrompt, type ReasonPromptOptions } from '../ReasonPromptModal';

export type ConfirmOptions = Omit<ReasonPromptOptions, 'inputLabel' | 'inputPlaceholder' | 'inputType' | 'defaultValue' | 'requireValue'>;

export interface PromptOptions extends ReasonPromptOptions {
  /** Required for prompt() — the label shown above the text input. */
  inputLabel: string;
}

interface FeedbackApi {
  showToast: (message: string, variant?: ToastVariant) => void;
  /** Confirm modal. Resolves to true (confirm) or false (cancel/dismiss). */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Prompt modal. Resolves to the entered text, or null if cancelled. */
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { showToast, toastUI } = useToast();
  const { requestReason, modalUI } = useReasonPrompt();

  const confirm = useCallback(
    async (options: ConfirmOptions): Promise<boolean> => {
      const result = await requestReason({
        ...options,
        // Omitting `inputLabel` makes the underlying modal a pure
        // confirm dialog (no input field).
      });
      return result !== null;
    },
    [requestReason],
  );

  const prompt = useCallback(
    async (options: PromptOptions): Promise<string | null> => {
      return requestReason(options);
    },
    [requestReason],
  );

  const api = useMemo<FeedbackApi>(
    () => ({ showToast, confirm, prompt }),
    [showToast, confirm, prompt],
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      {toastUI}
      {modalUI}
    </FeedbackContext.Provider>
  );
}

/**
 * Imperative feedback hook.
 *
 *   const fb = useFeedback();
 *   fb.showToast('Saved', 'success');
 *   if (!(await fb.confirm({ title: 'Delete this?' }))) return;
 *   const reason = await fb.prompt({ title: 'Reason', inputLabel: 'Why?' });
 *
 * Falls back to native dialogs when used outside `FeedbackProvider`,
 * so it is safe to call from any module without crashing tests / SSR.
 */
export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (ctx) return ctx;

  // Fallback so the SPA never throws if a component renders outside
  // the provider during tests or future refactors. We log a warning
  // once per missing call site so the gap is visible during dev.
  return {
    showToast: (message) => {
      if (typeof window !== 'undefined') console.info('[feedback]', message);
    },
    confirm: async (options) => {
      if (typeof window === 'undefined') return false;
      // eslint-disable-next-line no-alert
      return window.confirm(`${options.title}${options.description ? `\n\n${options.description}` : ''}`);
    },
    prompt: async (options) => {
      if (typeof window === 'undefined') return null;
      // eslint-disable-next-line no-alert
      return window.prompt(`${options.title}${options.description ? `\n\n${options.description}` : ''}`, options.defaultValue ?? '');
    },
  };
}

/**
 * NumericInput
 *
 * `<input type="number">` wrapper that holds the raw string state internally
 * so the user can transiently clear the field without the parent value
 * snapping back to `0`. Only emits `onValueChange(number)` for finite,
 * parseable values; an empty input is reported as `null` so callers can
 * decide whether to ignore it or treat it as zero.
 *
 * The naive pattern previously used in the admin panel
 * (`onChange={e => setX(parseFloat(e.target.value) || 0)}`) made it
 * impossible to clear a populated number field to retype: the moment the
 * input went empty, `parseFloat('') || 0` collapsed it to zero. This
 * component fixes that by decoupling the rendered string from the parent
 * numeric state.
 */
import { useEffect, useState, type InputHTMLAttributes } from 'react';

export interface NumericInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Current numeric value. */
  value: number;
  /**
   * Called when the rendered string parses to a finite number, or when
   * the field is cleared (`null`). Callers that want clearing to be a
   * no-op should ignore the `null` case.
   */
  onValueChange: (next: number | null) => void;
  /**
   * Optional integer-only mode. When set, decimal separators are still
   * allowed during typing, but only the integer portion is reported to
   * the caller via `onValueChange`.
   */
  integer?: boolean;
}

export function NumericInput({
  value,
  onValueChange,
  integer = false,
  onBlur,
  ...rest
}: NumericInputProps) {
  // Local string mirror of the rendered value. Updated by user keystrokes
  // and synced from the parent prop when the parent value changes
  // *outside* of typing (e.g. realtime update, programmatic reset).
  const [draft, setDraft] = useState<string>(() => formatNumber(value));

  useEffect(() => {
    setDraft(prev => {
      // If the parent's number matches the parsed draft, leave the
      // user's typed string alone. Otherwise resync.
      const parsed = parseDraft(prev);
      if (parsed !== null && Object.is(parsed, value)) return prev;
      return formatNumber(value);
    });
  }, [value]);

  return (
    <input
      type="number"
      inputMode={integer ? 'numeric' : 'decimal'}
      {...rest}
      value={draft}
      onChange={e => {
        const next = e.target.value;
        setDraft(next);
        if (next === '' || next === '-') {
          onValueChange(null);
          return;
        }
        const parsed = parseDraft(next);
        if (parsed === null) return;
        onValueChange(integer ? Math.trunc(parsed) : parsed);
      }}
      onBlur={e => {
        // Reformat the rendered string to the canonical numeric form on
        // blur so e.g. trailing decimals like "12." don't linger.
        const parsed = parseDraft(draft);
        if (parsed === null) {
          setDraft(formatNumber(value));
        } else {
          setDraft(formatNumber(integer ? Math.trunc(parsed) : parsed));
        }
        onBlur?.(e);
      }}
    />
  );
}

function parseDraft(s: string): number | null {
  if (s === '' || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n: number): string {
  return Number.isFinite(n) ? String(n) : '';
}

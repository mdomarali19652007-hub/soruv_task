-- Add the publicly-displayed deposit (Send Money) number to the
-- `settings` row so admins can change it without a deploy. Previously
-- `01774397545` was hardcoded in `src/features/finance/FinanceView.tsx`.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS "depositNumber" TEXT DEFAULT '01774397545';

UPDATE public.settings
   SET "depositNumber" = COALESCE("depositNumber", '01774397545')
 WHERE id = 'global';

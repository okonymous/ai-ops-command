ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assigned_to_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assigned_names text[] NOT NULL DEFAULT '{}';

-- Backfill the new array columns from the existing single-engineer columns
UPDATE public.tasks
SET assigned_to_ids = ARRAY[assigned_to]
WHERE assigned_to IS NOT NULL AND assigned_to_ids = '{}';

UPDATE public.tasks
SET assigned_names = ARRAY[assigned_name]
WHERE assigned_name IS NOT NULL AND assigned_names = '{}';
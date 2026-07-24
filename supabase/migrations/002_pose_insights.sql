-- ═══════════════════════════════════════════════════════════════════════
-- LA NICHE — 002 : verdicts + impressions horodatées (drydown) sur les
-- poses. Idempotent.
-- ═══════════════════════════════════════════════════════════════════════

alter table public.walk_applications
  add column if not exists verdict text
    check (verdict in ('loved', 'maybe', 'no')),
  add column if not exists impressions jsonb not null default '[]';

comment on column public.walk_applications.verdict is
  'Verdict rapide : loved (coup de cœur) / maybe (à revoir) / no.';
comment on column public.walk_applications.impressions is
  'Micro-notes horodatées du drydown : [{"at": iso8601, "text": string}].';

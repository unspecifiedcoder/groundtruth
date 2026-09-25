-- Production hardening: close direct anonymous access, lock privileged RPCs,
-- constrain evidence uploads, and add an append-only operations audit table.

drop policy if exists "anon read tasks" on tasks;
drop policy if exists "anon read workers" on workers;

-- All public reads now flow through the application, which returns redacted
-- DTOs and enforces campaign capabilities. The service role remains implicit.
revoke all on table tasks, payments, workers, proof_hashes, campaigns from anon, authenticated;

-- SECURITY DEFINER functions must never remain executable by PUBLIC: otherwise
-- an anon Supabase client can bypass the application and claim work or modify
-- worker counters directly.
revoke all on function claim_task(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function increment_worker(text, text, text) from public, anon, authenticated;
grant execute on function claim_task(uuid, text, timestamptz) to service_role;
grant execute on function increment_worker(text, text, text) to service_role;

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif']
where id = 'proofs';

create table if not exists audit_events (
  id          uuid primary key default uuid_generate_v4(),
  event_type  text not null,
  actor_type  text not null,
  actor_ref   text,
  resource_type text not null,
  resource_id text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_events_resource_idx on audit_events (resource_type, resource_id, created_at desc);
create index if not exists audit_events_created_idx on audit_events (created_at desc);
alter table audit_events enable row level security;
revoke all on table audit_events from public, anon, authenticated;

-- Audit records are retained independently of a task row for dispute response.
grant select, insert on table audit_events to service_role;

create table if not exists api_rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0
);
alter table api_rate_limits enable row level security;
revoke all on table api_rate_limits from public, anon, authenticated;

create or replace function check_api_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits integer;
begin
  insert into api_rate_limits as limits (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when limits.window_start < now() - make_interval(secs => p_window_seconds) then now() else limits.window_start end,
    hits = case when limits.window_start < now() - make_interval(secs => p_window_seconds) then 1 else limits.hits + 1 end
  returning hits into v_hits;
  return v_hits > p_max;
end;
$$;

revoke all on function check_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function check_api_rate_limit(text, integer, integer) to service_role;

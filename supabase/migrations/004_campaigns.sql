-- Retail field campaigns group location-bound tasks into one buyer workflow.

create table if not exists campaigns (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null,
  customer_name         text not null,
  brief                 text not null default '',
  status                text not null default 'active'
                        check (status in ('draft','active','completed','cancelled')),
  access_token_hash     text not null,
  budget_per_task_usdt  text not null,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null
);

alter table tasks add column if not exists campaign_id uuid references campaigns(id) on delete set null;
create index if not exists tasks_campaign_id_idx on tasks (campaign_id);
create index if not exists campaigns_created_at_idx on campaigns (created_at desc);

alter table campaigns enable row level security;
-- No anonymous campaign policy: campaign reads go through the server after
-- validating the capability token. Service-role access remains implicit.

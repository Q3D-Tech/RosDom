create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  locale text not null default 'ru-RU',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  device_name text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz null
);

create table if not exists refresh_tokens (
  id uuid primary key,
  session_id uuid not null references user_sessions(id) on delete cascade,
  token_hash text not null unique,
  issued_at timestamptz not null default now(),
  rotated_at timestamptz null,
  revoked_at timestamptz null
);

create table if not exists homes (
  id uuid primary key,
  owner_user_id uuid not null references users(id),
  title text not null,
  address_label text not null,
  timezone text not null,
  current_mode text not null,
  security_mode text not null,
  layout_revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists home_members (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  status text not null,
  created_at timestamptz not null default now(),
  unique(home_id, user_id)
);

create table if not exists rooms (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  title text not null,
  type text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_home_sort on rooms(home_id, sort_order);

create table if not exists room_layout_blocks (
  id uuid primary key,
  room_id uuid not null references rooms(id) on delete cascade,
  x integer not null,
  y integer not null,
  width integer not null,
  height integer not null,
  z_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists devices (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null,
  category text not null,
  vendor text not null,
  model text not null,
  connection_type text not null,
  transport_mode text not null,
  external_device_ref text not null,
  availability_status text not null,
  last_seen_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(home_id, external_device_ref, connection_type)
);

create table if not exists device_room_anchors (
  id uuid primary key,
  device_id uuid not null references devices(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  x integer not null,
  y integer not null,
  anchor_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists device_capabilities (
  id uuid primary key,
  device_id uuid not null references devices(id) on delete cascade,
  key text not null,
  type text not null,
  readable boolean not null,
  writable boolean not null,
  unit text null,
  range_min numeric null,
  range_max numeric null,
  step numeric null,
  allowed_options jsonb null,
  validation_rules jsonb not null default '{}'::jsonb,
  source text not null,
  last_sync_at timestamptz not null,
  freshness text not null,
  quality text not null,
  created_at timestamptz not null default now(),
  unique(device_id, key)
);

create table if not exists device_connections (
  id uuid primary key,
  device_id uuid not null references devices(id) on delete cascade,
  transport_mode text not null,
  health_state text not null,
  metadata jsonb not null default '{}'::jsonb,
  encrypted_secret bytea null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists device_state_snapshots (
  id uuid primary key,
  device_id uuid not null references devices(id) on delete cascade,
  observed_at timestamptz not null,
  source text not null,
  values jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_device_snapshots_device_observed
  on device_state_snapshots(device_id, observed_at desc);

create table if not exists firmware_records (
  id uuid primary key,
  device_id uuid not null references devices(id) on delete cascade,
  version text not null,
  channel text not null,
  recorded_at timestamptz not null
);

create table if not exists command_logs (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  device_id uuid not null references devices(id) on delete cascade,
  capability_key text not null,
  requested_value jsonb not null,
  requested_at timestamptz not null,
  actor_user_id uuid not null references users(id),
  idempotency_key text not null,
  delivery_status text not null,
  failure_reason text null,
  external_command_ref text null,
  acknowledged_at timestamptz null,
  reconciled_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(home_id, idempotency_key)
);

create index if not exists idx_command_logs_device_requested
  on command_logs(device_id, requested_at desc);

create table if not exists scenarios (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  title text not null,
  description text not null,
  icon_key text not null,
  enabled boolean not null default true,
  execution_mode text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scenario_triggers (
  id uuid primary key,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  type text not null,
  config jsonb not null default '{}'::jsonb
);

create table if not exists scenario_conditions (
  id uuid primary key,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  operator text not null,
  subject text not null,
  value jsonb not null,
  logical_group text not null
);

create table if not exists scenario_actions (
  id uuid primary key,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  capability_key text not null,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  delay_ms integer not null default 0
);

create table if not exists automation_runs (
  id uuid primary key,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  status text not null,
  started_at timestamptz not null,
  finished_at timestamptz null
);

create table if not exists events (
  id uuid primary key,
  event_offset bigserial not null,
  home_id uuid not null references homes(id) on delete cascade,
  room_id uuid null references rooms(id) on delete set null,
  device_id uuid null references devices(id) on delete set null,
  user_id uuid null references users(id) on delete set null,
  topic text not null,
  severity text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(event_offset)
);

create index if not exists idx_events_home_offset on events(home_id, event_offset);
create index if not exists idx_events_home_created on events(home_id, created_at desc);

create table if not exists notifications (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  event_id uuid null references events(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_read_created
  on notifications(user_id, read_at, created_at desc);

create table if not exists audit_logs (
  id uuid primary key,
  actor_user_id uuid not null references users(id),
  home_id uuid null references homes(id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  action text not null,
  reason text not null,
  payload_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists integration_accounts (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  provider text not null,
  status text not null,
  encrypted_credentials bytea null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pairing_sessions (
  id uuid primary key,
  public_token text not null unique,
  home_id uuid not null references homes(id) on delete cascade,
  actor_user_id uuid not null references users(id),
  device_type text not null,
  discovery_method text not null,
  status text not null,
  expires_at timestamptz not null,
  completed_at timestamptz null,
  selected_candidate_id text null,
  candidate_list_hash text null,
  candidates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists outbox_messages (
  id bigserial primary key,
  topic text not null,
  payload jsonb not null,
  published_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists job_leases (
  job_name text primary key,
  lease_holder text not null,
  leased_until timestamptz not null,
  updated_at timestamptz not null default now()
);

create or replace view latest_device_state_v as
select distinct on (device_id)
  id,
  device_id,
  observed_at,
  source,
  values,
  created_at
from device_state_snapshots
order by device_id, observed_at desc;

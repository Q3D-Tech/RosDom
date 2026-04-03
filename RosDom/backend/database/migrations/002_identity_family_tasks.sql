alter table users alter column email drop not null;

alter table users
  add column if not exists login_identifier text,
  add column if not exists identifier_type text,
  add column if not exists birth_year integer,
  add column if not exists account_mode text not null default 'adult',
  add column if not exists updated_at timestamptz not null default now();

update users
set login_identifier = coalesce(login_identifier, email),
    identifier_type = coalesce(identifier_type, 'email'),
    birth_year = coalesce(birth_year, 1990),
    account_mode = coalesce(account_mode, 'adult');

create unique index if not exists idx_users_login_identifier on users(login_identifier);

create table if not exists user_credentials (
  user_id uuid primary key references users(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists families (
  id uuid primary key,
  title text not null,
  owner_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists family_members (
  id uuid primary key,
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  guardian_user_id uuid null references users(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(family_id, user_id)
);

create table if not exists family_invites (
  id uuid primary key,
  family_id uuid not null references families(id) on delete cascade,
  code text not null unique,
  target_account_mode text not null,
  created_by_user_id uuid not null references users(id) on delete cascade,
  claimed_by_user_id uuid null references users(id) on delete set null,
  status text not null default 'active',
  expires_at timestamptz not null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table homes
  add column if not exists family_id uuid null references families(id) on delete set null;

create table if not exists layout_items (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  kind text not null,
  subtype text not null,
  title text null,
  x integer not null,
  y integer not null,
  width integer not null,
  height integer not null,
  rotation integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  family_id uuid null references families(id) on delete set null,
  room_id uuid null references rooms(id) on delete set null,
  assignee_user_id uuid not null references users(id) on delete cascade,
  created_by_user_id uuid not null references users(id) on delete cascade,
  approved_by_user_id uuid null references users(id) on delete set null,
  title text not null,
  description text not null,
  reward_type text not null,
  reward_value integer not null,
  reward_description text not null,
  target_x integer null,
  target_y integer null,
  status text not null default 'pending',
  deadline_at timestamptz null,
  submitted_at timestamptz null,
  approved_at timestamptz null,
  rejected_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists task_submissions (
  id uuid primary key,
  task_id uuid not null references tasks(id) on delete cascade,
  submitted_by_user_id uuid not null references users(id) on delete cascade,
  note text null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists reward_balances (
  user_id uuid not null references users(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, home_id)
);

create table if not exists reward_ledger (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  home_id uuid not null references homes(id) on delete cascade,
  task_id uuid null references tasks(id) on delete set null,
  delta integer not null,
  entry_type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists device_media_assets (
  id uuid primary key,
  vendor text not null,
  model text not null,
  source_url text not null,
  image_url text not null,
  license_note text not null,
  created_at timestamptz not null default now(),
  unique(vendor, model)
);

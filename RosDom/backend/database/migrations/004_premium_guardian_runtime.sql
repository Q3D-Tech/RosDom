alter table user_preferences
  add column if not exists theme_mode text not null default 'system',
  add column if not exists motion_mode text not null default 'standard';

create table if not exists integration_link_sessions (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  provider text not null,
  status text not null,
  account_label text not null,
  region text not null,
  user_code text not null,
  verification_uri text not null,
  expires_at timestamptz not null,
  linked_at timestamptz null,
  created_by_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_integration_link_sessions_home_provider
  on integration_link_sessions(home_id, provider, created_at desc);

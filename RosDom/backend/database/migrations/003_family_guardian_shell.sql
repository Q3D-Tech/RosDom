create table if not exists floors (
  id uuid primary key,
  home_id uuid not null references homes(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_floors_home_sort on floors(home_id, sort_order);

alter table rooms
  add column if not exists floor_id uuid null references floors(id) on delete set null;

create index if not exists idx_rooms_home_floor_sort on rooms(home_id, floor_id, sort_order);

alter table tasks
  add column if not exists floor_id uuid null references floors(id) on delete set null;

create index if not exists idx_tasks_home_floor on tasks(home_id, floor_id, created_at desc);

create table if not exists user_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  favorite_device_ids jsonb not null default '[]'::jsonb,
  allowed_device_ids jsonb not null default '[]'::jsonb,
  pinned_sections jsonb not null default '[]'::jsonb,
  preferred_home_tab text not null default 'home',
  ui_density text not null default 'comfortable',
  active_floor_id uuid null references floors(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

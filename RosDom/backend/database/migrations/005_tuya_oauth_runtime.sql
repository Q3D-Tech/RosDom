alter table integration_link_sessions
  add column if not exists state text null,
  add column if not exists authorization_url text null,
  add column if not exists integration_account_id uuid null references integration_accounts(id) on delete set null,
  add column if not exists failure_code text null,
  add column if not exists failure_message text null;

create unique index if not exists idx_integration_link_sessions_state
  on integration_link_sessions(state)
  where state is not null;

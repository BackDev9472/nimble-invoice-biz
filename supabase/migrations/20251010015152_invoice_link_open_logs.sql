create table link_open_logs (
  id bigint generated always as identity primary key,
  invoice_id bigint not null,
  opened_at timestamptz not null default now(),
  user_agent text,
  ip_address text
);
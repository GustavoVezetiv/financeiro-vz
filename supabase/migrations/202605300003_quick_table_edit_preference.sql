alter table public.profiles
  add column if not exists allow_quick_table_edit boolean not null default false;

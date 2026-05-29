alter table public.accounts_payable
  add column if not exists recurrence_frequency text
    check (recurrence_frequency is null or recurrence_frequency in ('monthly', 'weekly', 'yearly')),
  add column if not exists recurrence_start_date date,
  add column if not exists recurrence_end_date date,
  add column if not exists recurrence_parent_id uuid references public.accounts_payable(id) on delete set null,
  add column if not exists recurrence_generated_until date;

create index if not exists accounts_payable_recurrence_parent_idx
  on public.accounts_payable(user_id, recurrence_parent_id, due_date);

comment on column public.accounts_payable.recurrence_frequency
is 'MVP recurrence frequency for manually generated future accounts: monthly, weekly or yearly.';

comment on column public.accounts_payable.recurrence_parent_id
is 'Original recurring account that generated this occurrence. Null means the row is the original account or a non-recurring account.';

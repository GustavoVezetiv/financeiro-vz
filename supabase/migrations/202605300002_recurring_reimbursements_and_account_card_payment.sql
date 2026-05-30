alter table public.reimbursements
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence_frequency text,
  add column if not exists recurrence_start_date date,
  add column if not exists recurrence_end_date date,
  add column if not exists recurrence_parent_id uuid references public.reimbursements(id) on delete set null,
  add column if not exists recurrence_generated_until date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reimbursements_recurrence_frequency_check'
  ) then
    alter table public.reimbursements
      add constraint reimbursements_recurrence_frequency_check
      check (recurrence_frequency is null or recurrence_frequency in ('monthly'));
  end if;
end $$;

create index if not exists reimbursements_recurrence_parent_idx
  on public.reimbursements(user_id, recurrence_parent_id, expected_date);

create unique index if not exists reimbursements_unique_generated_recurrence_date_idx
  on public.reimbursements(user_id, recurrence_parent_id, expected_date)
  where recurrence_parent_id is not null;

alter table public.accounts_payable
  add column if not exists paid_with_credit_card boolean not null default false,
  add column if not exists credit_card_transaction_id uuid references public.credit_card_transactions(id) on delete set null,
  add column if not exists credit_card_invoice_id uuid references public.credit_card_invoices(id) on delete set null;

create index if not exists accounts_payable_card_payment_idx
  on public.accounts_payable(user_id, credit_card_invoice_id, credit_card_transaction_id)
  where paid_with_credit_card = true;

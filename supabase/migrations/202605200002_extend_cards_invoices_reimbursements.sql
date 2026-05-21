alter type public.invoice_status add value if not exists 'partial';
alter type public.invoice_status add value if not exists 'cancelled';

alter type public.ownership_type add value if not exists 'shared';
alter type public.ownership_type add value if not exists 'family';

alter type public.expected_status add value if not exists 'late';
alter type public.expected_status add value if not exists 'cancelled';
alter type public.expected_status add value if not exists 'forgiven';

alter table public.credit_cards
  add column if not exists brand text,
  add column if not exists notes text;

alter table public.credit_card_invoices
  add column if not exists notes text;

alter table public.credit_card_transactions
  add column if not exists installment_number integer check (installment_number is null or installment_number > 0),
  add column if not exists installment_total integer check (installment_total is null or installment_total > 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'credit_card_transactions_installment_number_lte_total'
  ) then
    alter table public.credit_card_transactions
      add constraint credit_card_transactions_installment_number_lte_total
    check (
      installment_number is null
      or installment_total is null
      or installment_number <= installment_total
    ) not valid;
  end if;
end $$;

alter table public.reimbursements
  add column if not exists income_source_id uuid references public.income_sources(id) on delete set null,
  add column if not exists received_date date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reimbursements_received_date_matches_received_at'
  ) then
    alter table public.reimbursements
      add constraint reimbursements_received_date_matches_received_at
      check (
        received_date is null
        or received_at is null
        or received_date = received_at::date
      ) not valid;
  end if;
end $$;

create index if not exists reimbursements_transaction_idx
  on public.reimbursements(user_id, credit_card_transaction_id);

create index if not exists reimbursements_person_status_idx
  on public.reimbursements(user_id, person_id, status);

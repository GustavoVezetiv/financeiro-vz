alter type public.record_status add value if not exists 'active';
alter type public.record_status add value if not exists 'finished';
alter type public.record_status add value if not exists 'cancelled';
alter type public.record_status add value if not exists 'paused';
alter type public.record_status add value if not exists 'planned';
alter type public.record_status add value if not exists 'done';
alter type public.record_status add value if not exists 'skipped';

alter type public.payment_plan_status add value if not exists 'completed';
alter type public.payment_plan_status add value if not exists 'cancelled';

alter type public.payment_decision add value if not exists 'pay_when_income_arrives';
alter type public.payment_decision add value if not exists 'ignore_for_now';

alter table public.installments
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists person_id uuid references public.people(id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists installment_total integer check (installment_total is null or installment_total > 0),
  add column if not exists current_installment integer check (current_installment is null or current_installment > 0),
  add column if not exists notes text;

update public.installments
set
  installment_total = coalesce(installment_total, installment_count),
  current_installment = coalesce(current_installment, installment_number),
  start_date = coalesce(start_date, due_month),
  end_date = coalesce(end_date, due_month)
where
  installment_total is null
  or current_installment is null
  or start_date is null
  or end_date is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'installments_current_lte_total'
  ) then
    alter table public.installments
      add constraint installments_current_lte_total
      check (
        current_installment is null
        or installment_total is null
        or current_installment <= installment_total
      ) not valid;
  end if;
end $$;

alter table public.payment_plans
  add column if not exists description text;

alter table public.payment_plan_items
  add column if not exists installment_id uuid references public.installments(id) on delete set null,
  add column if not exists reimbursement_id uuid references public.reimbursements(id) on delete set null,
  add column if not exists income_source_id uuid references public.income_sources(id) on delete set null,
  add column if not exists description text,
  add column if not exists planned_payment_date date,
  add column if not exists notes text;

create index if not exists installments_user_status_idx
  on public.installments(user_id, status);

create index if not exists payment_plans_user_status_idx
  on public.payment_plans(user_id, status);

create index if not exists payment_plan_items_plan_decision_idx
  on public.payment_plan_items(user_id, payment_plan_id, decision);

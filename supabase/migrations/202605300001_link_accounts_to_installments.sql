alter table public.accounts_payable
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_id uuid,
  add column if not exists installment_id uuid references public.installments(id) on delete set null,
  add column if not exists installment_number integer check (installment_number is null or installment_number > 0),
  add column if not exists is_generated boolean not null default false;

update public.accounts_payable
set source_type = 'manual'
where source_type is null;

create index if not exists accounts_payable_installment_idx
  on public.accounts_payable(user_id, installment_id, due_date)
  where installment_id is not null;

create unique index if not exists accounts_payable_unique_generated_installment_number_idx
  on public.accounts_payable(user_id, installment_id, installment_number)
  where is_generated = true and installment_id is not null and installment_number is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'accounts_payable_source_type_check'
  ) then
    alter table public.accounts_payable
      add constraint accounts_payable_source_type_check
      check (source_type in ('manual', 'recurring', 'installment'));
  end if;
end $$;

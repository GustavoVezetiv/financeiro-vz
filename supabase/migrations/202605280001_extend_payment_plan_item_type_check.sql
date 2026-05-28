do $$
declare
  existing_constraint_name text;
begin
  select conname
  into existing_constraint_name
  from pg_constraint
  where conrelid = 'public.payment_plan_items'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%item_type%'
  limit 1;

  if existing_constraint_name is not null then
    execute format(
      'alter table public.payment_plan_items drop constraint %I',
      existing_constraint_name
    );
  end if;

  alter table public.payment_plan_items
    add constraint payment_plan_items_item_type_check
    check (
      item_type in (
        'account_payable',
        'credit_card_invoice',
        'installment',
        'reimbursement',
        'income_source',
        'planned_purchase',
        'goal',
        'manual'
      )
    );
end $$;

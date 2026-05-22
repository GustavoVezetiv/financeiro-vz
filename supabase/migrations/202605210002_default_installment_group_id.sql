alter table public.installments
  alter column installment_group_id set default gen_random_uuid();

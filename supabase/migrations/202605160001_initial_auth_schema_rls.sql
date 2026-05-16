create extension if not exists pgcrypto;

create type public.category_type as enum (
  'expense',
  'income',
  'reimbursement',
  'debt',
  'transfer',
  'planned_purchase',
  'goal',
  'other'
);

create type public.inflow_kind as enum (
  'real_income',
  'reimbursement',
  'third_party_money'
);

create type public.record_status as enum (
  'pending',
  'scheduled',
  'paid',
  'overdue',
  'canceled'
);

create type public.expected_status as enum (
  'expected',
  'received',
  'partial',
  'overdue',
  'canceled'
);

create type public.invoice_status as enum (
  'open',
  'closed',
  'paid',
  'overdue',
  'canceled'
);

create type public.ownership_type as enum (
  'personal',
  'reimbursable',
  'third_party'
);

create type public.reimbursement_source_type as enum (
  'credit_card_transaction',
  'account_payable',
  'manual',
  'other'
);

create type public.risk_level as enum (
  'low',
  'medium',
  'high',
  'critical'
);

create type public.priority_level as enum (
  'low',
  'normal',
  'high',
  'critical'
);

create type public.payment_decision as enum (
  'pay_now',
  'wait',
  'parcel',
  'negotiate',
  'pay_by_card',
  'monitor',
  'skip'
);

create type public.payment_plan_status as enum (
  'draft',
  'active',
  'closed',
  'archived'
);

create type public.payment_method as enum (
  'cash',
  'credit_card',
  'installment',
  'unknown'
);

create type public.import_status as enum (
  'uploaded',
  'parsed',
  'validated',
  'imported',
  'failed',
  'canceled'
);

create type public.import_row_status as enum (
  'pending',
  'valid',
  'invalid',
  'skipped',
  'imported'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'BRL',
  timezone text not null default 'America/Cuiaba',
  month_start_day integer not null default 1 check (month_start_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_id_matches_user_id check (id = user_id)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship_type text not null default 'other',
  pix_key text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.category_type not null default 'expense',
  parent_category_id uuid references public.categories(id) on delete set null,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_unique_name_type_per_user unique (user_id, name, type)
);

create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  person_id uuid references public.people(id) on delete set null,
  title text not null,
  description text,
  amount numeric(14, 2) not null check (amount >= 0),
  due_date date not null,
  status public.record_status not null default 'pending',
  priority public.priority_level not null default 'normal',
  risk_level public.risk_level not null default 'medium',
  is_recurring boolean not null default false,
  recurrence_rule jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  source_type text not null default 'other_income',
  inflow_kind public.inflow_kind not null default 'real_income',
  amount numeric(14, 2) not null check (amount >= 0),
  expected_date date,
  is_recurring boolean not null default false,
  recurrence_rule jsonb,
  status public.expected_status not null default 'expected',
  received_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  last_four_digits text check (last_four_digits is null or length(last_four_digits) = 4),
  limit_amount numeric(14, 2) check (limit_amount is null or limit_amount >= 0),
  closing_day integer check (closing_day is null or closing_day between 1 and 31),
  due_day integer check (due_day is null or due_day between 1 and 31),
  cashback_rate numeric(5, 4) not null default 0 check (cashback_rate >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_card_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  reference_month date not null,
  closing_date date,
  due_date date not null,
  status public.invoice_status not null default 'open',
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  personal_amount numeric(14, 2) not null default 0 check (personal_amount >= 0),
  reimbursable_amount numeric(14, 2) not null default 0 check (reimbursable_amount >= 0),
  third_party_amount numeric(14, 2) not null default 0 check (third_party_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_unique_card_month unique (user_id, credit_card_id, reference_month)
);

create table public.credit_card_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards(id) on delete cascade,
  invoice_id uuid references public.credit_card_invoices(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  person_id uuid references public.people(id) on delete set null,
  description text not null,
  merchant text,
  amount numeric(14, 2) not null check (amount >= 0),
  transaction_date date not null,
  posting_date date,
  ownership_type public.ownership_type not null default 'personal',
  is_reimbursable boolean not null default false,
  reimbursement_status text not null default 'not_applicable' check (
    reimbursement_status in ('not_applicable', 'pending', 'partial', 'received')
  ),
  installment_group_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reimbursements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  source_type public.reimbursement_source_type not null default 'manual',
  source_id uuid,
  credit_card_transaction_id uuid references public.credit_card_transactions(id) on delete set null,
  account_payable_id uuid references public.accounts_payable(id) on delete set null,
  credit_card_invoice_id uuid references public.credit_card_invoices(id) on delete set null,
  description text,
  expected_amount numeric(14, 2) not null check (expected_amount >= 0),
  received_amount numeric(14, 2) not null default 0 check (received_amount >= 0),
  expected_date date,
  received_at timestamptz,
  status public.expected_status not null default 'expected',
  pix_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reimbursements_received_lte_expected check (received_amount <= expected_amount)
);

create table public.installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  installment_group_id uuid not null,
  credit_card_transaction_id uuid references public.credit_card_transactions(id) on delete set null,
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  invoice_id uuid references public.credit_card_invoices(id) on delete set null,
  description text not null,
  total_amount numeric(14, 2) not null check (total_amount >= 0),
  installment_amount numeric(14, 2) not null check (installment_amount >= 0),
  installment_number integer not null check (installment_number > 0),
  installment_count integer not null check (installment_count > 0),
  due_month date not null,
  status public.record_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint installments_number_lte_count check (installment_number <= installment_count)
);

create table public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_month date not null,
  name text not null,
  starting_balance numeric(14, 2) not null default 0,
  projected_income numeric(14, 2) not null default 0,
  projected_reimbursements numeric(14, 2) not null default 0,
  projected_expenses numeric(14, 2) not null default 0,
  projected_ending_balance numeric(14, 2) not null default 0,
  status public.payment_plan_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_plan_id uuid not null references public.payment_plans(id) on delete cascade,
  item_type text not null check (
    item_type in ('account_payable', 'credit_card_invoice', 'planned_purchase', 'goal', 'manual')
  ),
  source_id uuid,
  account_payable_id uuid references public.accounts_payable(id) on delete set null,
  credit_card_invoice_id uuid references public.credit_card_invoices(id) on delete set null,
  planned_purchase_id uuid,
  goal_id uuid,
  title text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  due_date date,
  decision public.payment_decision not null default 'monitor',
  priority public.priority_level not null default 'normal',
  risk_level public.risk_level not null default 'medium',
  status public.record_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.planned_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  estimated_amount numeric(14, 2) not null default 0 check (estimated_amount >= 0),
  target_date date,
  payment_method public.payment_method not null default 'unknown',
  credit_card_id uuid references public.credit_cards(id) on delete set null,
  installment_count integer check (installment_count is null or installment_count > 0),
  decision_status text not null default 'considering' check (
    decision_status in ('considering', 'approved', 'delayed', 'canceled', 'purchased')
  ),
  risk_level public.risk_level not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_plan_items
  add constraint payment_plan_items_planned_purchase_fk
  foreign key (planned_purchase_id) references public.planned_purchases(id) on delete set null;

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_type text not null default 'other' check (
    goal_type in ('emergency_reserve', 'debt_reduction', 'planned_purchase', 'savings', 'other')
  ),
  target_amount numeric(14, 2) not null default 0 check (target_amount >= 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  monthly_contribution numeric(14, 2) not null default 0 check (monthly_contribution >= 0),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_plan_items
  add constraint payment_plan_items_goal_fk
  foreign key (goal_id) references public.goals(id) on delete set null;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null default 'general',
  entity_id uuid,
  title text,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (
    module in (
      'credit_card_transactions',
      'accounts_payable',
      'reimbursements',
      'income_sources',
      'people',
      'categories',
      'planned_purchases'
    )
  ),
  file_name text not null,
  file_type text not null check (file_type in ('csv', 'xlsx')),
  status public.import_status not null default 'uploaded',
  total_rows integer not null default 0 check (total_rows >= 0),
  valid_rows integer not null default 0 check (valid_rows >= 0),
  invalid_rows integer not null default 0 check (invalid_rows >= 0),
  mapping_config jsonb,
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null default '{}'::jsonb,
  parsed_data jsonb,
  validation_errors jsonb,
  status public.import_row_status not null default 'pending',
  target_entity_type text,
  target_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_rows_unique_row_per_batch unique (import_batch_id, row_number)
);

create index people_user_id_idx on public.people(user_id);
create index categories_user_id_idx on public.categories(user_id);
create index accounts_payable_user_due_idx on public.accounts_payable(user_id, due_date);
create index income_sources_user_expected_idx on public.income_sources(user_id, expected_date);
create index credit_cards_user_id_idx on public.credit_cards(user_id);
create index credit_card_invoices_user_due_idx on public.credit_card_invoices(user_id, due_date);
create index credit_card_transactions_user_date_idx on public.credit_card_transactions(user_id, transaction_date);
create index reimbursements_user_status_idx on public.reimbursements(user_id, status);
create index installments_user_due_month_idx on public.installments(user_id, due_month);
create index payment_plans_user_month_idx on public.payment_plans(user_id, reference_month);
create index payment_plan_items_user_plan_idx on public.payment_plan_items(user_id, payment_plan_id);
create index planned_purchases_user_target_idx on public.planned_purchases(user_id, target_date);
create index goals_user_id_idx on public.goals(user_id);
create index notes_user_entity_idx on public.notes(user_id, entity_type, entity_id);
create index import_batches_user_id_idx on public.import_batches(user_id);
create index import_rows_user_batch_idx on public.import_rows(user_id, import_batch_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, display_name)
  values (
    new.id,
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'people',
    'categories',
    'accounts_payable',
    'income_sources',
    'credit_cards',
    'credit_card_invoices',
    'credit_card_transactions',
    'reimbursements',
    'installments',
    'payment_plans',
    'payment_plan_items',
    'planned_purchases',
    'goals',
    'notes',
    'import_batches',
    'import_rows'
  ]
  loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'people',
    'categories',
    'accounts_payable',
    'income_sources',
    'credit_cards',
    'credit_card_invoices',
    'credit_card_transactions',
    'reimbursements',
    'installments',
    'payment_plans',
    'payment_plan_items',
    'planned_purchases',
    'goals',
    'notes',
    'import_batches',
    'import_rows'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format(
      'create policy "%1$I_select_own" on public.%1$I for select using (user_id = auth.uid())',
      table_name
    );

    execute format(
      'create policy "%1$I_insert_own" on public.%1$I for insert with check (user_id = auth.uid())',
      table_name
    );

    execute format(
      'create policy "%1$I_update_own" on public.%1$I for update using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name
    );

    execute format(
      'create policy "%1$I_delete_own" on public.%1$I for delete using (user_id = auth.uid())',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.create_default_categories_for_current_user()
returns void
language plpgsql
security invoker
as $$
begin
  if auth.uid() is null then
    raise exception 'create_default_categories_for_current_user requires an authenticated user';
  end if;

  insert into public.categories (user_id, name, type)
  values
    (auth.uid(), 'Moradia', 'expense'),
    (auth.uid(), 'Alimentação', 'expense'),
    (auth.uid(), 'Transporte', 'expense'),
    (auth.uid(), 'Cartão', 'expense'),
    (auth.uid(), 'Financiamento', 'debt'),
    (auth.uid(), 'Família', 'expense'),
    (auth.uid(), 'Amigos', 'expense'),
    (auth.uid(), 'Reembolso', 'reimbursement'),
    (auth.uid(), 'Freelance', 'income'),
    (auth.uid(), 'Salário', 'income'),
    (auth.uid(), 'Bolsa', 'income'),
    (auth.uid(), 'Compras', 'planned_purchase'),
    (auth.uid(), 'Tecnologia', 'expense'),
    (auth.uid(), 'Saúde', 'expense'),
    (auth.uid(), 'Educação', 'expense'),
    (auth.uid(), 'Lazer', 'expense'),
    (auth.uid(), 'Outros', 'other')
  on conflict (user_id, name, type) do nothing;
end;
$$;

comment on function public.create_default_categories_for_current_user()
is 'Optional seed helper. Call after login as an authenticated user; it never creates global categories.';


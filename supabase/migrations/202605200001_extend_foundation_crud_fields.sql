alter type public.category_type add value if not exists 'purchase';
alter type public.priority_level add value if not exists 'medium';

alter table public.people
  add column if not exists email text,
  add column if not exists phone text;

alter table public.categories
  add column if not exists icon text,
  add column if not exists is_default boolean not null default false;

alter table public.accounts_payable
  add column if not exists payment_method_planned text not null default 'unknown'
    check (
      payment_method_planned in (
        'cash',
        'pix',
        'credit_card',
        'bank_slip',
        'debit',
        'transfer',
        'negotiation',
        'unknown'
      )
    ),
  add column if not exists can_delay boolean not null default false,
  add column if not exists delay_risk public.risk_level not null default 'medium',
  add column if not exists notes text;

alter table public.income_sources
  add column if not exists person_id uuid references public.people(id) on delete set null,
  add column if not exists description text,
  add column if not exists confidence text not null default 'medium'
    check (confidence in ('low', 'medium', 'high', 'uncertain')),
  add column if not exists received_date date,
  add column if not exists notes text;

drop function if exists public.create_default_categories_for_current_user();

create or replace function public.create_default_categories_for_current_user()
returns void
language plpgsql
security invoker
as $$
begin
  if auth.uid() is null then
    raise exception 'create_default_categories_for_current_user requires an authenticated user';
  end if;

  insert into public.categories (user_id, name, type, icon, is_default)
  values
    (auth.uid(), 'Moradia', 'expense', 'home', true),
    (auth.uid(), 'Alimentação', 'expense', 'utensils', true),
    (auth.uid(), 'Transporte', 'expense', 'car', true),
    (auth.uid(), 'Cartão', 'expense', 'credit-card', true),
    (auth.uid(), 'Financiamento', 'debt', 'file-text', true),
    (auth.uid(), 'Família', 'expense', 'users', true),
    (auth.uid(), 'Amigos', 'expense', 'user-round', true),
    (auth.uid(), 'Reembolso', 'reimbursement', 'repeat', true),
    (auth.uid(), 'Freelance', 'income', 'briefcase', true),
    (auth.uid(), 'Salário', 'income', 'wallet', true),
    (auth.uid(), 'Bolsa', 'income', 'graduation-cap', true),
    (auth.uid(), 'Compras', 'purchase', 'shopping-bag', true),
    (auth.uid(), 'Tecnologia', 'expense', 'laptop', true),
    (auth.uid(), 'Saúde', 'expense', 'heart-pulse', true),
    (auth.uid(), 'Educação', 'expense', 'book-open', true),
    (auth.uid(), 'Lazer', 'expense', 'ticket', true),
    (auth.uid(), 'Outros', 'other', 'circle-help', true)
  on conflict (user_id, name, type) do update
  set
    icon = excluded.icon,
    is_default = true,
    updated_at = now();
end;
$$;

comment on function public.create_default_categories_for_current_user()
is 'Optional seed helper. Call after login as an authenticated user; it creates only user-owned default categories.';

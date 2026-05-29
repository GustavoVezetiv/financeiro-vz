alter table public.installments
  add column if not exists installment_origin text not null default 'other'
    check (installment_origin in ('card', 'invoice', 'bank_slip', 'financing', 'informal_debt', 'other'));

update public.installments
set installment_origin = case
  when invoice_id is not null then 'invoice'
  when credit_card_id is not null then 'card'
  else installment_origin
end
where installment_origin = 'other';

create index if not exists installments_user_origin_idx
  on public.installments(user_id, installment_origin);

comment on column public.installments.installment_origin
is 'MVP source/origin for installments: card, invoice, bank slip, financing, informal debt or other.';

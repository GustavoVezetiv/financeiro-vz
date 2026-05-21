"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import {
  ActionButton,
  BooleanBadge,
  CrudFeedback,
  FieldShell,
  inputClassName,
  Modal,
} from "@/features/shared/crud-ui";
import { formatCurrency } from "@/features/shared/format";
import type { FeedbackState } from "@/features/shared/types";
import {
  createCreditCard,
  deleteCreditCard,
  listCreditCards,
  updateCreditCard,
} from "@/features/credit-cards/queries";
import {
  creditCardToFormValues,
  emptyCreditCardForm,
  type CreditCardFormValues,
  type CreditCardRow,
} from "@/features/credit-cards/types";
import { createClient } from "@/lib/supabase/client";

type ModalState = { mode: "create"; card: null } | { mode: "edit"; card: CreditCardRow } | null;

export function CreditCardsCrud() {
  const [cards, setCards] = useState<CreditCardRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const filteredCards = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return cards.filter(
      (card) =>
        !needle ||
        card.name.toLowerCase().includes(needle) ||
        (card.issuer ?? "").toLowerCase().includes(needle),
    );
  }, [cards, search]);

  async function loadCards() {
    setLoading(true);
    setFeedback(null);
    const client = createClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      setLoading(false);
      return;
    }

    setUserId(user.id);
    const { data, error } = await listCreditCards(client);

    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      setCards(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadCards();
  }, []);

  async function handleSubmit(values: CreditCardFormValues) {
    const limit = Number(values.limit_amount || 0);

    if (!values.name.trim()) {
      setFeedback({ type: "error", message: "Informe o nome do cartão." });
      return;
    }

    if (limit < 0 || Number.isNaN(limit)) {
      setFeedback({ type: "error", message: "O limite deve ser maior ou igual a zero." });
      return;
    }

    if (!userId) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      return;
    }

    setSaving(true);
    const client = createClient();
    const result =
      modal?.mode === "edit"
        ? await updateCreditCard(client, modal.card.id, values)
        : await createCreditCard(client, userId, values);

    if (result.error) {
      setFeedback({ type: "error", message: result.error.message });
    } else {
      setFeedback({ type: "success", message: modal?.mode === "edit" ? "Cartão atualizado." : "Cartão criado." });
      setModal(null);
      await loadCards();
    }

    setSaving(false);
  }

  async function handleDelete(card: CreditCardRow) {
    if (!window.confirm(`Excluir ${card.name}?`)) return;
    const { error } = await deleteCreditCard(createClient(), card.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Cartão excluído." });
      await loadCards();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Crédito"
        title="Cartões"
        description="Cadastre cartões usados para cashback e controle de faturas."
        action={<ActionButton onClick={() => setModal({ mode: "create", card: null })}>Novo cartão</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />
      <SectionCard title="Busca" description="Busque por nome ou emissor.">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClassName} placeholder="XP, Nubank, Mercado Pago" />
      </SectionCard>
      <SectionCard title="Cartões cadastrados">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando cartões...</p>
        ) : cards.length === 0 ? (
          <EmptyState title="Nenhum cartão cadastrado" description="Crie cartões para lançar faturas e compras." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Emissor</th>
                  <th className="px-4 py-3">Bandeira</th>
                  <th className="px-4 py-3">Fechamento</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Limite</th>
                  <th className="px-4 py-3">Ativo</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {filteredCards.map((card) => (
                  <tr key={card.id}>
                    <td className="px-4 py-3 font-medium text-ink-950">{card.name}</td>
                    <td className="px-4 py-3 text-ink-600">{card.issuer ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{card.brand ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{card.closing_day ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{card.due_day ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{formatCurrency(Number(card.limit_amount ?? 0))}</td>
                    <td className="px-4 py-3"><BooleanBadge value={card.is_active} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", card })}>Editar</ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDelete(card)}>Excluir</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      {modal ? (
        <CardModal modal={modal} saving={saving} onClose={() => setModal(null)} onSubmit={(values) => void handleSubmit(values)} />
      ) : null}
    </div>
  );
}

function CardModal({
  modal,
  saving,
  onClose,
  onSubmit,
}: {
  modal: ModalState;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: CreditCardFormValues) => void;
}) {
  const [values, setValues] = useState<CreditCardFormValues>(
    modal?.mode === "edit" ? creditCardToFormValues(modal.card) : emptyCreditCardForm,
  );

  return (
    <Modal title={modal?.mode === "edit" ? "Editar cartão" : "Novo cartão"} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <FieldShell label="Nome"><input required className={inputClassName} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></FieldShell>
        <FieldShell label="Emissor"><input className={inputClassName} value={values.issuer} onChange={(event) => setValues({ ...values, issuer: event.target.value })} /></FieldShell>
        <FieldShell label="Bandeira"><input className={inputClassName} value={values.brand} onChange={(event) => setValues({ ...values, brand: event.target.value })} placeholder="Visa, Mastercard..." /></FieldShell>
        <FieldShell label="Limite"><input className={inputClassName} type="number" min="0" step="0.01" value={values.limit_amount} onChange={(event) => setValues({ ...values, limit_amount: event.target.value })} /></FieldShell>
        <FieldShell label="Dia de fechamento"><input className={inputClassName} type="number" min="1" max="31" value={values.closing_day} onChange={(event) => setValues({ ...values, closing_day: event.target.value })} /></FieldShell>
        <FieldShell label="Dia de vencimento"><input className={inputClassName} type="number" min="1" max="31" value={values.due_day} onChange={(event) => setValues({ ...values, due_day: event.target.value })} /></FieldShell>
        <FieldShell label="Status">
          <select className={inputClassName} value={String(values.is_active)} onChange={(event) => setValues({ ...values, is_active: event.target.value === "true" })}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </FieldShell>
        <div className="md:col-span-2">
          <FieldShell label="Notas"><textarea className={inputClassName} rows={3} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></FieldShell>
        </div>
        <div className="flex justify-end gap-2 md:col-span-2">
          <ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton>
          <ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton>
        </div>
      </form>
    </Modal>
  );
}


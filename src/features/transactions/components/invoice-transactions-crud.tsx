"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { calculateInvoiceSummary, type InvoiceCard, type InvoiceReimbursementRow, type InvoiceRow } from "@/features/invoices/types";
import { ActionButton, BooleanBadge, CrudFeedback, FieldShell, inputClassName, Modal } from "@/features/shared/crud-ui";
import { formatCurrency, formatDate } from "@/features/shared/format";
import { optionLabel, ownershipTypeOptions } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import {
  createExpectedReimbursementForTransaction,
  createTransaction,
  deleteTransaction,
  listTransactionSupportData,
  updateTransaction,
} from "@/features/transactions/queries";
import {
  emptyTransactionForm,
  transactionToFormValues,
  type TransactionCategory,
  type TransactionFormValues,
  type TransactionInvoice,
  type TransactionPerson,
  type TransactionRow,
} from "@/features/transactions/types";
import { createClient } from "@/lib/supabase/client";
import type { OwnershipType } from "@/lib/supabase/types";

type ModalState = { mode: "create"; transaction: null } | { mode: "edit"; transaction: TransactionRow } | null;

export function InvoiceTransactionsCrud({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [cards, setCards] = useState<InvoiceCard[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [reimbursements, setReimbursements] = useState<InvoiceReimbursementRow[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [people, setPeople] = useState<TransactionPerson[]>([]);
  const [invoices, setInvoices] = useState<TransactionInvoice[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const cardName = cards.find((card) => card.id === invoice?.credit_card_id)?.name ?? "Cartão";
  const summary = useMemo(
    () => (invoice ? calculateInvoiceSummary(invoice, transactions, reimbursements) : null),
    [invoice, reimbursements, transactions],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const client = createClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setFeedback({ type: "error", message: "Sessão não encontrada." });
      setLoading(false);
      return;
    }

    setUserId(auth.user.id);
    const [invoiceResult, cardsResult, transactionsResult, reimbursementsResult, support] =
      await Promise.all([
        client.from("credit_card_invoices").select("*").eq("id", invoiceId).single(),
        client.from("credit_cards").select("id,name,issuer").order("name", { ascending: true }),
        client
          .from("credit_card_transactions")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("transaction_date", { ascending: false }),
        client.from("reimbursements").select("*").eq("credit_card_invoice_id", invoiceId),
        listTransactionSupportData(client),
      ]);

    if (invoiceResult.error) setFeedback({ type: "error", message: invoiceResult.error.message });
    else setInvoice(invoiceResult.data);
    if (cardsResult.error) setFeedback({ type: "error", message: cardsResult.error.message });
    else setCards(cardsResult.data ?? []);
    if (transactionsResult.error) setFeedback({ type: "error", message: transactionsResult.error.message });
    else setTransactions(transactionsResult.data ?? []);
    if (reimbursementsResult.error) setFeedback({ type: "error", message: reimbursementsResult.error.message });
    else setReimbursements(reimbursementsResult.data ?? []);
    if (!support.categories.error) setCategories(support.categories.data ?? []);
    if (!support.people.error) setPeople(support.people.data ?? []);
    if (!support.invoices.error) setInvoices(support.invoices.data ?? []);
    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(values: TransactionFormValues) {
    if (!values.credit_card_id || !values.invoice_id || !values.transaction_date || !values.description.trim()) {
      setFeedback({ type: "error", message: "Cartão, fatura, data e descrição são obrigatórios." });
      return;
    }
    if (Number(values.amount) < 0) {
      setFeedback({ type: "error", message: "O valor deve ser maior ou igual a zero." });
      return;
    }
    if (values.is_reimbursable && !values.person_id) {
      setFeedback({ type: "error", message: "Informe a pessoa responsável pelo reembolso." });
      return;
    }
    if (!userId) return;

    setSaving(true);
    const client = createClient();
    const result =
      modal?.mode === "edit"
        ? await updateTransaction(client, modal.transaction.id, values)
        : await createTransaction(client, userId, values);

    if (result.error) {
      setFeedback({ type: "error", message: result.error.message });
    } else {
      if (modal?.mode === "create" && values.create_reimbursement && values.is_reimbursable) {
        const reimbursementResult = await createExpectedReimbursementForTransaction(
          client,
          userId,
          result.data,
          values.reimbursement_expected_date,
        );
        if (reimbursementResult.error) {
          setFeedback({ type: "error", message: reimbursementResult.error.message });
          setSaving(false);
          return;
        }
      }
      setFeedback({
        type: "success",
        message: modal?.mode === "edit" ? "Lançamento atualizado." : "Lançamento criado.",
      });
      setModal(null);
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(transaction: TransactionRow) {
    if (!window.confirm("Excluir este lançamento?")) return;
    const { error } = await deleteTransaction(createClient(), transaction.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Lançamento excluído." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fatura"
        title={invoice ? `${cardName} - ${invoice.reference_month.slice(0, 7)}` : "Lançamentos"}
        description="Separe despesa pessoal, despesa de terceiro e valores reembolsáveis dentro da fatura."
        action={<ActionButton onClick={() => setModal({ mode: "create", transaction: null })}>Novo lançamento</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />

      {summary ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total da fatura" value={formatCurrency(summary.invoiceTotal)} helper="Valor declarado ou soma dos lançamentos." tone="info" />
          <StatCard label="Pendente" value={formatCurrency(summary.pendingAmount)} helper="Total menos valor pago." tone="warning" />
          <StatCard label="Reembolsável" value={formatCurrency(summary.reimbursableAmount)} helper="Parte vinculada a terceiros ou família." tone="warning" />
          <StatCard label="Custo pessoal líquido" value={formatCurrency(summary.netPersonalCost)} helper="Lançamentos menos reembolsos esperados." tone="success" />
        </section>
      ) : null}

      <SectionCard
        title="Aviso financeiro"
        description="Reembolso reduz impacto de caixa, mas não é renda livre."
      >
        <p className="text-sm leading-6 text-ink-600">
          Use reembolsos para rastrear quem deve cobrir a despesa. O dinheiro recebido por Pix deve
          ficar ligado ao lançamento original para não inflar a renda real.
        </p>
      </SectionCard>

      <SectionCard title="Lançamentos da fatura">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando lançamentos...</p>
        ) : transactions.length === 0 ? (
          <EmptyState title="Nenhum lançamento" description="Cadastre compras da fatura e marque o que é reembolsável." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Reembolsável</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-3 text-ink-600">{formatDate(transaction.transaction_date)}</td>
                    <td className="px-4 py-3 font-medium text-ink-950">{transaction.description}</td>
                    <td className="px-4 py-3 text-ink-950">{formatCurrency(Number(transaction.amount))}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {optionLabel(ownershipTypeOptions, transaction.ownership_type)}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {people.find((person) => person.id === transaction.person_id)?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3"><BooleanBadge value={transaction.is_reimbursable} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", transaction })}>
                          Editar
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDelete(transaction)}>
                          Excluir
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Link className="text-sm font-semibold text-mint-600 hover:text-mint-700" href="/dashboard/invoices">
        Voltar para faturas
      </Link>

      {modal ? (
        <TransactionModal
          categories={categories}
          cards={cards}
          invoices={invoices}
          modal={modal}
          people={people}
          saving={saving}
          selectedInvoiceId={invoiceId}
          onClose={() => setModal(null)}
          onSubmit={(values) => void handleSubmit(values)}
        />
      ) : null}
    </div>
  );
}

function TransactionModal({
  categories,
  cards,
  invoices,
  modal,
  people,
  saving,
  selectedInvoiceId,
  onClose,
  onSubmit,
}: {
  categories: TransactionCategory[];
  cards: InvoiceCard[];
  invoices: TransactionInvoice[];
  modal: ModalState;
  people: TransactionPerson[];
  saving: boolean;
  selectedInvoiceId: string;
  onClose: () => void;
  onSubmit: (values: TransactionFormValues) => void;
}) {
  const selectedInvoice = invoices.find((item) => item.id === selectedInvoiceId);
  const initialValues =
    modal?.mode === "edit"
      ? transactionToFormValues(modal.transaction)
      : {
          ...emptyTransactionForm,
          invoice_id: selectedInvoiceId,
          credit_card_id: selectedInvoice?.credit_card_id ?? "",
          transaction_date: new Date().toISOString().slice(0, 10),
        };
  const [values, setValues] = useState<TransactionFormValues>(initialValues);
  const canCreateReimbursement = values.is_reimbursable && values.person_id;

  return (
    <Modal
      title={modal?.mode === "edit" ? "Editar lançamento" : "Novo lançamento"}
      description="Marque como reembolsável quando a compra foi feita para outra pessoa ou família."
      onClose={onClose}
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
      >
        <FieldShell label="Cartão">
          <select
            required
            className={inputClassName}
            value={values.credit_card_id}
            onChange={(event) => setValues({ ...values, credit_card_id: event.target.value })}
          >
            <option value="">Selecione</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>{card.name}</option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Fatura">
          <select
            required
            className={inputClassName}
            value={values.invoice_id}
            onChange={(event) => setValues({ ...values, invoice_id: event.target.value })}
          >
            <option value="">Selecione</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.reference_month.slice(0, 7)} - {formatDate(invoice.due_date)}
              </option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Data">
          <input
            required
            type="date"
            className={inputClassName}
            value={values.transaction_date}
            onChange={(event) => setValues({ ...values, transaction_date: event.target.value })}
          />
        </FieldShell>
        <FieldShell label="Valor">
          <input
            required
            min="0"
            step="0.01"
            type="number"
            className={inputClassName}
            value={values.amount}
            onChange={(event) => setValues({ ...values, amount: event.target.value })}
          />
        </FieldShell>
        <div className="md:col-span-2">
          <FieldShell label="Descrição">
            <input
              required
              className={inputClassName}
              value={values.description}
              onChange={(event) => setValues({ ...values, description: event.target.value })}
            />
          </FieldShell>
        </div>
        <FieldShell label="Categoria">
          <select
            className={inputClassName}
            value={values.category_id}
            onChange={(event) => setValues({ ...values, category_id: event.target.value })}
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Pessoa responsável">
          <select
            className={inputClassName}
            value={values.person_id}
            onChange={(event) => setValues({ ...values, person_id: event.target.value })}
          >
            <option value="">Sem pessoa</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Tipo de despesa">
          <select
            className={inputClassName}
            value={values.ownership_type}
            onChange={(event) => {
              const ownershipType = event.target.value as OwnershipType;
              setValues({
                ...values,
                ownership_type: ownershipType,
                is_reimbursable: ownershipType !== "personal" ? values.is_reimbursable : false,
              });
            }}
          >
            {ownershipTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Reembolsável">
          <select
            className={inputClassName}
            value={String(values.is_reimbursable)}
            onChange={(event) => setValues({ ...values, is_reimbursable: event.target.value === "true" })}
          >
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        </FieldShell>
        <FieldShell label="Parcela atual">
          <input
            min="1"
            type="number"
            className={inputClassName}
            value={values.installment_number}
            onChange={(event) => setValues({ ...values, installment_number: event.target.value })}
          />
        </FieldShell>
        <FieldShell label="Total de parcelas">
          <input
            min="1"
            type="number"
            className={inputClassName}
            value={values.installment_total}
            onChange={(event) => setValues({ ...values, installment_total: event.target.value })}
          />
        </FieldShell>
        {modal?.mode === "create" ? (
          <>
            <FieldShell label="Criar reembolso esperado">
              <select
                className={inputClassName}
                disabled={!canCreateReimbursement}
                value={String(values.create_reimbursement)}
                onChange={(event) =>
                  setValues({ ...values, create_reimbursement: event.target.value === "true" })
                }
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </FieldShell>
            <FieldShell label="Data prevista do Pix">
              <input
                type="date"
                className={inputClassName}
                disabled={!values.create_reimbursement}
                value={values.reimbursement_expected_date}
                onChange={(event) =>
                  setValues({ ...values, reimbursement_expected_date: event.target.value })
                }
              />
            </FieldShell>
          </>
        ) : null}
        <div className="md:col-span-2">
          <FieldShell label="Notas">
            <textarea
              rows={3}
              className={inputClassName}
              value={values.notes}
              onChange={(event) => setValues({ ...values, notes: event.target.value })}
            />
          </FieldShell>
        </div>
        <div className="flex justify-end gap-2 md:col-span-2">
          <ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton>
          <ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton>
        </div>
      </form>
    </Modal>
  );
}

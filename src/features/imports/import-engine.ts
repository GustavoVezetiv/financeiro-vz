import type { ImportTarget, PreviewRow, RawImportRow, ReferenceData } from "@/features/imports/types";
import type { Json } from "@/lib/supabase/types";

type Mapped = Record<string, Json>;

const categoryTypes = ["expense", "income", "reimbursement", "purchase", "goal", "other", "debt"];
const accountStatuses = ["pending", "paid", "overdue", "canceled", "cancelled"];
const incomeStatuses = ["expected", "received", "partial", "overdue", "late", "canceled", "cancelled"];
const invoiceStatuses = ["open", "closed", "paid", "partial", "overdue", "canceled", "cancelled"];
const ownershipTypes = ["personal", "third_party", "shared", "family", "reimbursable"];
const reimbursementStatuses = ["expected", "partial", "received", "late", "overdue", "canceled", "cancelled", "forgiven"];
const installmentStatuses = ["active", "finished", "cancelled", "paused"];
const riskLevels = ["low", "medium", "high", "critical"];

export function buildPreviewRows(target: ImportTarget, rawRows: RawImportRow[], references: ReferenceData) {
  const seen = new Set<string>();
  return rawRows.map((raw, index) => validateRow(target, raw, index + 2, references, seen));
}

export function rowCounts(rows: PreviewRow[]) {
  return {
    total: rows.length,
    valid: rows.filter((row) => row.status === "valid").length,
    invalid: rows.filter((row) => row.status === "invalid").length,
    skipped: rows.filter((row) => row.status === "skipped").length,
    imported: rows.filter((row) => row.status === "imported").length,
  };
}

export function buildInsertPayload(target: ImportTarget, userId: string, mapped: Mapped) {
  if (target === "people") {
    return {
      user_id: userId,
      name: mapped.name,
      relationship_type: mapped.relationship_type ?? "other",
      email: mapped.email ?? null,
      phone: mapped.phone ?? null,
      notes: mapped.notes ?? null,
      is_active: mapped.is_active ?? true,
    };
  }
  if (target === "categories") {
    return {
      user_id: userId,
      name: mapped.name,
      type: mapped.type ?? "expense",
      color: mapped.color ?? null,
      icon: mapped.icon ?? null,
      is_active: mapped.is_active ?? true,
    };
  }
  if (target === "accounts_payable") {
    return {
      user_id: userId,
      title: mapped.title,
      description: mapped.description ?? null,
      amount: mapped.amount,
      due_date: mapped.due_date,
      category_id: mapped.category_id ?? null,
      person_id: mapped.person_id ?? null,
      priority: mapped.priority ?? "medium",
      risk_level: mapped.risk_level ?? "medium",
      status: mapped.status ?? "pending",
      payment_method_planned: mapped.payment_method_planned ?? "unknown",
      can_delay: mapped.can_delay ?? false,
      delay_risk: mapped.delay_risk ?? "medium",
      notes: mapped.notes ?? null,
    };
  }
  if (target === "income_sources") {
    return {
      user_id: userId,
      name: mapped.name,
      description: mapped.description ?? null,
      amount: mapped.amount,
      expected_date: mapped.expected_date,
      received_date: mapped.received_date ?? null,
      received_at: mapped.received_date ? `${mapped.received_date}T00:00:00.000Z` : null,
      category_id: mapped.category_id ?? null,
      person_id: mapped.person_id ?? null,
      source_type: mapped.source_type ?? "other_income",
      inflow_kind: mapped.inflow_kind ?? "real_income",
      confidence: mapped.confidence ?? "medium",
      status: mapped.status ?? "expected",
      notes: mapped.notes ?? null,
    };
  }
  if (target === "credit_cards") {
    return {
      user_id: userId,
      name: mapped.name,
      issuer: mapped.issuer ?? null,
      brand: mapped.brand ?? null,
      closing_day: mapped.closing_day ?? null,
      due_day: mapped.due_day ?? null,
      limit_amount: mapped.limit_amount ?? null,
      is_active: mapped.is_active ?? true,
      notes: mapped.notes ?? null,
    };
  }
  if (target === "credit_card_invoices") {
    return {
      user_id: userId,
      credit_card_id: mapped.credit_card_id,
      reference_month: mapped.reference_month,
      closing_date: mapped.closing_date ?? null,
      due_date: mapped.due_date,
      total_amount: mapped.total_amount ?? 0,
      paid_amount: mapped.paid_amount ?? 0,
      status: mapped.status ?? "open",
      notes: mapped.notes ?? null,
    };
  }
  if (target === "credit_card_transactions") {
    return {
      user_id: userId,
      credit_card_id: mapped.credit_card_id,
      invoice_id: mapped.invoice_id ?? null,
      transaction_date: mapped.transaction_date,
      description: mapped.description,
      amount: mapped.amount,
      category_id: mapped.category_id ?? null,
      person_id: mapped.person_id ?? null,
      ownership_type: mapped.ownership_type ?? "personal",
      installment_number: mapped.installment_number ?? null,
      installment_total: mapped.installment_total ?? null,
      is_reimbursable: mapped.is_reimbursable ?? false,
      reimbursement_status: mapped.is_reimbursable ? "expected" : "not_applicable",
      notes: mapped.notes ?? null,
    };
  }
  if (target === "reimbursements") {
    return {
      user_id: userId,
      person_id: mapped.person_id,
      description: mapped.description,
      expected_amount: mapped.expected_amount,
      received_amount: mapped.received_amount ?? 0,
      expected_date: mapped.expected_date ?? null,
      received_date: mapped.received_date ?? null,
      received_at: mapped.received_date ? `${mapped.received_date}T00:00:00.000Z` : null,
      status: mapped.status ?? "expected",
      source_type: "manual",
      notes: mapped.notes ?? null,
    };
  }
  if (target === "installments") {
    const total = Number(mapped.installment_total ?? 1);
    const current = Number(mapped.current_installment ?? 1);
    return {
      user_id: userId,
      installment_group_id: crypto.randomUUID(),
      description: mapped.description,
      total_amount: mapped.total_amount ?? Number(mapped.installment_amount ?? 0) * total,
      installment_amount: mapped.installment_amount ?? 0,
      installment_total: total,
      current_installment: current,
      installment_count: total,
      installment_number: current,
      due_month: mapped.start_date,
      start_date: mapped.start_date,
      end_date: mapped.end_date ?? null,
      credit_card_id: mapped.credit_card_id ?? null,
      status: mapped.status ?? "active",
      notes: mapped.notes ?? null,
    };
  }
  if (target === "planned_purchases") {
    return {
      user_id: userId,
      title: mapped.title,
      description: mapped.description ?? null,
      estimated_amount: mapped.estimated_amount ?? 0,
      target_date: mapped.target_date ?? null,
      category_id: mapped.category_id ?? null,
      payment_method: mapped.payment_method ?? "unknown",
      decision_status: mapped.status ?? "considering",
      risk_level: mapped.risk_level ?? "medium",
      notes: mapped.notes ?? null,
    };
  }
  return {
    user_id: userId,
    name: mapped.name,
    goal_type: mapped.goal_type ?? "other",
    target_amount: mapped.target_amount ?? 0,
    current_amount: mapped.current_amount ?? 0,
    target_date: mapped.target_date ?? null,
    monthly_contribution: mapped.monthly_contribution ?? 0,
    status: mapped.status ?? "active",
  };
}

function validateRow(
  target: ImportTarget,
  raw: RawImportRow,
  rowNumber: number,
  references: ReferenceData,
  seen: Set<string>,
): PreviewRow {
  const errors: string[] = [];
  const mapped = mapRow(target, raw, references, errors);
  const duplicateKey = buildDuplicateKey(target, mapped);
  if (duplicateKey) {
    if (seen.has(duplicateKey) || existsDuplicate(target, mapped, references)) {
      errors.push("Duplicidade detectada. A linha não será importada por padrão.");
    }
    seen.add(duplicateKey);
  }
  return { rowNumber, raw, mapped, status: errors.length ? "invalid" : "valid", errors };
}

function mapRow(target: ImportTarget, raw: RawImportRow, references: ReferenceData, errors: string[]): Mapped {
  if (target === "people") {
    const name = text(raw.nome);
    requireField(errors, name, "Nome");
    return {
      name,
      relationship_type: normalizeEnum(raw.tipo, ["family", "friend", "client", "payer", "other"], "other"),
      email: nullable(raw.email),
      phone: nullable(raw.telefone),
      notes: nullable(raw.observacoes),
      is_active: bool(raw.ativo, true),
    };
  }
  if (target === "categories") {
    const name = text(raw.nome);
    const type = normalizeEnum(raw.tipo, categoryTypes, "expense");
    requireField(errors, name, "Nome");
    return { name, type, color: nullable(raw.cor), icon: nullable(raw.icone), is_active: bool(raw.ativa, true) };
  }
  if (target === "accounts_payable") {
    const title = text(raw.titulo);
    const amount = money(raw.valor, errors, "Valor");
    const dueDate = date(raw.vencimento, errors, "Vencimento");
    requireField(errors, title, "Título");
    const categoryId = resolveCategory(raw.categoria, references, errors);
    const personId = resolvePerson(raw.pessoa, references, errors);
    return {
      title,
      description: nullable(raw.descricao),
      amount,
      due_date: dueDate,
      category_id: categoryId,
      person_id: personId,
      priority: normalizeEnum(raw.prioridade, ["low", "medium", "high", "critical", "normal"], "medium"),
      status: normalizeEnum(raw.status, accountStatuses, "pending"),
      payment_method_planned: normalizeEnum(raw.forma_pagamento_planejada, ["cash", "pix", "credit_card", "bank_slip", "debit", "transfer", "negotiation", "unknown"], "unknown"),
      can_delay: bool(raw.pode_atrasar, false),
      delay_risk: normalizeEnum(raw.risco_atraso, riskLevels, "medium"),
      risk_level: normalizeEnum(raw.risco_atraso, riskLevels, "medium"),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "income_sources") {
    const name = text(raw.origem);
    const amount = money(raw.valor, errors, "Valor");
    const expectedDate = date(raw.data_prevista, errors, "Data prevista");
    requireField(errors, name, "Origem");
    return {
      name,
      description: nullable(raw.descricao),
      amount,
      expected_date: expectedDate,
      received_date: optionalDate(raw.data_recebida, errors, "Data recebida"),
      category_id: resolveCategory(raw.categoria, references, errors),
      person_id: resolvePerson(raw.pessoa, references, errors),
      source_type: normalizeIncomeSourceType(raw.tipo),
      inflow_kind: normalizeInflowKind(raw.tipo),
      confidence: normalizeEnum(raw.confianca, ["low", "medium", "high", "uncertain"], "medium"),
      status: normalizeEnum(raw.status, incomeStatuses, "expected"),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "credit_cards") {
    const name = text(raw.nome);
    requireField(errors, name, "Nome");
    return {
      name,
      issuer: nullable(raw.emissor),
      brand: nullable(raw.bandeira),
      closing_day: optionalInteger(raw.dia_fechamento, errors, "Dia de fechamento"),
      due_day: optionalInteger(raw.dia_vencimento, errors, "Dia de vencimento"),
      limit_amount: optionalMoney(raw.limite, errors, "Limite"),
      is_active: bool(raw.ativo, true),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "credit_card_invoices") {
    const cardId = resolveCard(raw.cartao, references, errors);
    const referenceMonth = month(raw.mes_referencia || raw.data_vencimento, errors, "Mês de referência");
    const dueDate = date(raw.data_vencimento, errors, "Data de vencimento");
    return {
      credit_card_id: cardId,
      reference_month: referenceMonth,
      closing_date: optionalDate(raw.data_fechamento, errors, "Data de fechamento"),
      due_date: dueDate,
      total_amount: money(raw.valor_total, errors, "Valor total"),
      paid_amount: optionalMoney(raw.valor_pago, errors, "Valor pago") ?? 0,
      status: normalizeEnum(raw.status, invoiceStatuses, "open"),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "credit_card_transactions") {
    const invoiceId = resolveInvoice(raw.fatura, raw.cartao, references, errors, false);
    const cardId = invoiceId
      ? references.invoices.find((item) => item.id === invoiceId)?.credit_card_id
      : resolveCard(raw.cartao, references, errors);
    const description = text(raw.descricao);
    requireField(errors, description, "Descrição");
    return {
      credit_card_id: cardId ?? null,
      invoice_id: invoiceId,
      transaction_date: date(raw.data, errors, "Data"),
      description,
      amount: money(raw.valor, errors, "Valor"),
      category_id: resolveCategory(raw.categoria, references, errors),
      person_id: resolvePerson(raw.pessoa, references, errors),
      ownership_type: normalizeEnum(raw.tipo_responsabilidade, ownershipTypes, "personal"),
      installment_number: optionalInteger(raw.numero_parcela, errors, "Número da parcela"),
      installment_total: optionalInteger(raw.total_parcelas, errors, "Total de parcelas"),
      is_reimbursable: bool(raw.reembolsavel, false),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "reimbursements") {
    const description = text(raw.descricao);
    requireField(errors, description, "Descrição");
    return {
      person_id: resolvePerson(raw.pessoa, references, errors, true),
      description,
      expected_amount: money(raw.valor_esperado, errors, "Valor esperado"),
      received_amount: optionalMoney(raw.valor_recebido, errors, "Valor recebido") ?? 0,
      expected_date: optionalDate(raw.data_prevista, errors, "Data prevista"),
      received_date: optionalDate(raw.data_recebida, errors, "Data recebida"),
      status: normalizeEnum(raw.status, reimbursementStatuses, "expected"),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "installments") {
    const description = text(raw.descricao);
    requireField(errors, description, "Descrição");
    const installmentAmount = optionalMoney(raw.valor_parcela, errors, "Valor da parcela");
    const totalAmount = optionalMoney(raw.valor_total, errors, "Valor total");
    if (installmentAmount === null && totalAmount === null) errors.push("Informe valor_total ou valor_parcela.");
    return {
      description,
      total_amount: totalAmount,
      installment_amount: installmentAmount ?? totalAmount ?? 0,
      installment_total: optionalInteger(raw.total_parcelas, errors, "Total de parcelas") ?? 1,
      current_installment: optionalInteger(raw.parcela_atual, errors, "Parcela atual") ?? 1,
      start_date: date(raw.data_inicio || raw.data_fim, errors, "Data inicial"),
      end_date: optionalDate(raw.data_fim, errors, "Data final"),
      credit_card_id: resolveCard(raw.cartao, references, errors),
      status: normalizeEnum(raw.status, installmentStatuses, "active"),
      notes: nullable(raw.observacoes),
    };
  }
  if (target === "planned_purchases") {
    const title = text(raw.item || raw.nome);
    requireField(errors, title, "Item");
    return {
      title,
      description: nullable(raw.descricao),
      estimated_amount: optionalMoney(raw.valor_estimado, errors, "Valor estimado") ?? 0,
      target_date: optionalDate(raw.data_alvo, errors, "Data alvo"),
      category_id: resolveCategory(raw.categoria, references, errors),
      payment_method: normalizeEnum(raw.metodo_pagamento, ["cash", "credit_card", "installment", "unknown"], "unknown"),
      status: normalizeEnum(raw.status, ["considering", "approved", "delayed", "canceled", "purchased"], "considering"),
      risk_level: normalizeEnum(raw.risco, riskLevels, "medium"),
      notes: nullable(raw.observacoes),
    };
  }
  const name = text(raw.nome);
  requireField(errors, name, "Nome");
  return {
    name,
    goal_type: normalizeEnum(raw.tipo, ["emergency_reserve", "debt_reduction", "planned_purchase", "savings", "other"], "other"),
    target_amount: optionalMoney(raw.valor_alvo, errors, "Valor alvo") ?? 0,
    current_amount: optionalMoney(raw.valor_atual, errors, "Valor atual") ?? 0,
    target_date: optionalDate(raw.data_alvo, errors, "Data alvo"),
    monthly_contribution: optionalMoney(raw.contribuicao_mensal, errors, "Contribuição mensal") ?? 0,
    status: normalizeEnum(raw.status, ["active", "paused", "completed", "canceled"], "active"),
  };
}

function buildDuplicateKey(target: ImportTarget, mapped: Mapped) {
  if (target === "people") return lower(mapped.name);
  if (target === "categories") return `${lower(mapped.name)}|${mapped.type}`;
  if (target === "accounts_payable") return `${lower(mapped.title)}|${mapped.amount}|${mapped.due_date}`;
  if (target === "income_sources") return `${lower(mapped.name)}|${mapped.amount}|${mapped.expected_date}`;
  if (target === "credit_cards") return `${lower(mapped.name)}|${lower(mapped.issuer)}`;
  if (target === "credit_card_invoices") return `${mapped.credit_card_id}|${mapped.reference_month}`;
  if (target === "credit_card_transactions") return `${mapped.invoice_id}|${mapped.transaction_date}|${lower(mapped.description)}|${mapped.amount}`;
  if (target === "reimbursements") return `${mapped.person_id}|${lower(mapped.description)}|${mapped.expected_amount}|${mapped.expected_date}`;
  return "";
}

function existsDuplicate(target: ImportTarget, mapped: Mapped, references: ReferenceData) {
  if (target === "people") return references.existing.people.some((item) => lower(item.name) === lower(mapped.name));
  if (target === "categories") return references.existing.categories.some((item) => lower(item.name) === lower(mapped.name) && item.type === mapped.type);
  if (target === "accounts_payable") return references.existing.accounts_payable.some((item) => lower(item.title) === lower(mapped.title) && Number(item.amount) === Number(mapped.amount) && item.due_date === mapped.due_date);
  if (target === "income_sources") return references.existing.income_sources.some((item) => lower(item.name) === lower(mapped.name) && Number(item.amount) === Number(mapped.amount) && item.expected_date === mapped.expected_date);
  if (target === "credit_cards") return references.existing.credit_cards.some((item) => lower(item.name) === lower(mapped.name) && lower(item.issuer) === lower(mapped.issuer));
  if (target === "credit_card_invoices") return references.existing.credit_card_invoices.some((item) => item.credit_card_id === mapped.credit_card_id && item.reference_month === mapped.reference_month);
  if (target === "credit_card_transactions") return references.existing.credit_card_transactions.some((item) => item.invoice_id === mapped.invoice_id && item.transaction_date === mapped.transaction_date && lower(item.description) === lower(mapped.description) && Number(item.amount) === Number(mapped.amount));
  if (target === "reimbursements") return references.existing.reimbursements.some((item) => item.person_id === mapped.person_id && lower(item.description) === lower(mapped.description) && Number(item.expected_amount) === Number(mapped.expected_amount) && item.expected_date === mapped.expected_date);
  return false;
}

function resolvePerson(value: string | undefined, references: ReferenceData, errors: string[], required = false) {
  const name = text(value);
  if (!name && !required) return null;
  const person = references.people.find((item) => lower(item.name) === lower(name));
  if (!person) errors.push(`Pessoa não encontrada: ${name || "(vazio)"}`);
  return person?.id ?? null;
}

function resolveCategory(value: string | undefined, references: ReferenceData, errors: string[]) {
  const name = text(value);
  if (!name) return null;
  const category = references.categories.find((item) => lower(item.name) === lower(name));
  if (!category) errors.push(`Categoria não encontrada: ${name}`);
  return category?.id ?? null;
}

function resolveCard(value: string | undefined, references: ReferenceData, errors: string[]) {
  const name = text(value);
  if (!name) {
    errors.push("Cartão é obrigatório ou precisa ser resolvido pela fatura.");
    return null;
  }
  const card = references.cards.find((item) => lower(item.name) === lower(name));
  if (!card) errors.push(`Cartão não encontrado: ${name}`);
  return card?.id ?? null;
}

function resolveInvoice(value: string | undefined, cardName: string | undefined, references: ReferenceData, errors: string[], required = true) {
  const input = text(value);
  if (!input && !required) return null;
  const referenceMonth = parseMonth(input);
  const card = cardName ? references.cards.find((item) => lower(item.name) === lower(cardName)) : null;
  const invoice = references.invoices.find(
    (item) =>
      (!card || item.credit_card_id === card.id) &&
      (item.reference_month.slice(0, 7) === referenceMonth || item.due_date === input),
  );
  if (!invoice) errors.push(`Fatura não encontrada: ${input || "(vazio)"}`);
  return invoice?.id ?? null;
}

function requireField(errors: string[], value: string, label: string) {
  if (!value) errors.push(`${label} é obrigatório.`);
}

function text(value: string | undefined) {
  return String(value ?? "").trim();
}

function nullable(value: string | undefined) {
  const normalized = text(value);
  return normalized ? normalized : null;
}

function lower(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function slug(value: string | undefined) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeEnum(value: string | undefined, allowed: string[], fallback: string) {
  const normalized = slug(value);
  if (!normalized) return fallback;
  const aliases: Record<string, string> = {
    sim: "true",
    nao: "false",
    familia: "family",
    amigo: "friend",
    cliente: "client",
    pagador: "payer",
    outro: "other",
    despesa: "expense",
    receita: "income",
    reembolso: "reimbursement",
    compra: "purchase",
    meta: "goal",
    baixa: "low",
    media: "medium",
    alta: "high",
    critica: "critical",
    pendente: "pending",
    pago: "paid",
    paga: "paid",
    atrasado: "overdue",
    atrasada: "overdue",
    cancelado: "canceled",
    cancelada: "canceled",
    aberta: "open",
    fechado: "closed",
    fechada: "closed",
    parcial: "partial",
    pessoal: "personal",
    terceiro: "third_party",
    compartilhada: "shared",
    ativo: "active",
    ativa: "active",
    finalizado: "finished",
    pausado: "paused",
  };
  const candidate = aliases[normalized] ?? normalized;
  return allowed.includes(candidate) ? candidate : fallback;
}

function normalizeInflowKind(value: string | undefined) {
  const normalized = slug(value);
  if (["reembolso", "reimbursement"].includes(normalized)) return "reimbursement";
  if (["dinheiro_de_terceiros", "terceiros", "third_party_money"].includes(normalized)) return "third_party_money";
  return "real_income";
}

function normalizeIncomeSourceType(value: string | undefined) {
  const normalized = slug(value);
  if (["salario", "salary"].includes(normalized)) return "salary";
  if (["freelance"].includes(normalized)) return "freelance";
  if (["bolsa", "scholarship"].includes(normalized)) return "scholarship";
  return "other";
}

function bool(value: string | undefined, fallback: boolean) {
  const normalized = slug(value);
  if (!normalized) return fallback;
  return ["sim", "true", "1", "yes", "ativo", "ativa"].includes(normalized);
}

function money(value: string | undefined, errors: string[], label: string) {
  const parsed = optionalMoney(value, errors, label);
  if (parsed === null) errors.push(`${label} é obrigatório.`);
  return parsed ?? 0;
}

function optionalMoney(value: string | undefined, errors: string[], label: string) {
  const raw = text(value);
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    errors.push(`${label} deve ser numérico e maior ou igual a zero.`);
    return null;
  }
  return parsed;
}

function optionalInteger(value: string | undefined, errors: string[], label: string) {
  const raw = text(value);
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    errors.push(`${label} deve ser um número inteiro válido.`);
    return null;
  }
  return parsed;
}

function date(value: string | undefined, errors: string[], label: string) {
  const parsed = optionalDate(value, errors, label);
  if (!parsed) errors.push(`${label} é obrigatório.`);
  return parsed ?? "";
}

function optionalDate(value: string | undefined, errors: string[], label: string) {
  const raw = text(value);
  if (!raw) return null;
  const normalized = parseDate(raw);
  if (!normalized) errors.push(`${label} deve ser uma data válida.`);
  return normalized;
}

function month(value: string | undefined, errors: string[], label: string) {
  const parsed = parseMonth(text(value));
  if (!parsed) errors.push(`${label} deve ser um mês válido.`);
  return parsed ? `${parsed}-01` : "";
}

function parseDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  const monthOnly = parseMonth(value);
  if (monthOnly) return `${monthOnly}-01`;
  return null;
}

function parseMonth(value: string) {
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  const slash = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[2]}-${slash[1].padStart(2, "0")}`;
  return "";
}

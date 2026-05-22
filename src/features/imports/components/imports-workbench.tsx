"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { buildPreviewRows, rowCounts } from "@/features/imports/import-engine";
import { parseSpreadsheetFile } from "@/features/imports/parser";
import {
  confirmImportRows,
  listImportBatches,
  loadImportReferenceData,
  saveImportPreview,
} from "@/features/imports/queries";
import {
  activeImportTargets,
  downloadTemplate,
  futureImportTargets,
  getImportTargetConfig,
} from "@/features/imports/templates";
import type { ImportTarget, PreviewRow } from "@/features/imports/types";
import { ActionButton, CrudFeedback, inputClassName, TextBadge } from "@/features/shared/crud-ui";
import { formatDate } from "@/features/shared/format";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";
import type { ImportBatch } from "@/lib/supabase/types";

export function ImportsWorkbench() {
  const [target, setTarget] = useState<ImportTarget>("people");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingAction, setWorkingAction] = useState<"parse" | "save" | "confirm" | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const counts = useMemo(() => rowCounts(rows), [rows]);
  const config = getImportTargetConfig(target);
  const working = workingAction !== null;

  async function loadHistory() {
    const client = createClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setFeedback({ type: "error", message: "Sessão não encontrada." });
      setLoading(false);
      return;
    }
    setUserId(auth.user.id);
    const result = await listImportBatches(client);
    if (result.error) setFeedback({ type: "error", message: result.error.message });
    else setBatches(result.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  async function handleParse() {
    if (!file) {
      setFeedback({ type: "error", message: "Selecione um arquivo CSV ou XLSX." });
      return;
    }
    setWorkingAction("parse");
    setFeedback(null);
    try {
      const client = createClient();
      const [rawRows, references] = await Promise.all([
        parseSpreadsheetFile(file),
        loadImportReferenceData(client),
      ]);
      const preview = buildPreviewRows(target, rawRows, references);
      setRows(preview);
      setBatchId(null);
      setFeedback({ type: "success", message: `${preview.length} linhas lidas. Revise a prévia antes de confirmar.` });
    } catch (error) {
      console.error("Erro técnico ao processar arquivo de importação:", error);
      setFeedback({
        type: "error",
        message: "Não foi possível ler o arquivo. Verifique se ele é um CSV ou XLSX válido.",
      });
    } finally {
      setWorkingAction(null);
    }
  }

  async function handleSavePreview() {
    if (!userId || !file || rows.length === 0) return;
    setWorkingAction("save");
    setFeedback(null);
    try {
      const result = await saveImportPreview(createClient(), userId, target, file, rows);
      if (result.batch.error || result.rows?.error) {
        console.error("Erro técnico ao salvar prévia de importação:", result.batch.error ?? result.rows?.error);
        setFeedback({
          type: "error",
          message: "Não foi possível salvar a prévia da importação. Revise os dados e tente novamente.",
        });
      } else {
        setBatchId(result.batch.data?.id ?? null);
        setFeedback({ type: "success", message: "Prévia salva. Agora você pode confirmar a importação." });
        await loadHistory();
      }
    } catch (error) {
      console.error("Erro técnico ao salvar prévia de importação:", error);
      setFeedback({ type: "error", message: "Não foi possível salvar a prévia da importação." });
    } finally {
      setWorkingAction(null);
    }
  }

  async function handleConfirm() {
    if (!userId || !batchId) {
      setFeedback({ type: "error", message: "Salve a prévia antes de confirmar." });
      return;
    }
    setWorkingAction("confirm");
    setFeedback(null);
    try {
      const updatedRows = await confirmImportRows(createClient(), userId, batchId, target, rows);
      setRows(updatedRows);
      setFeedback({ type: "success", message: "Importação confirmada. Linhas inválidas ou ignoradas não foram inseridas." });
      await loadHistory();
    } catch (error) {
      console.error("Erro técnico ao confirmar importação:", error);
      setFeedback({ type: "error", message: "Não foi possível confirmar a importação. Tente novamente." });
    } finally {
      setWorkingAction(null);
    }
  }

  function toggleSkip(rowNumber: number) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.rowNumber !== rowNumber || row.status === "imported") return row;
        if (row.status === "skipped") {
          return { ...row, status: row.errors.length ? "invalid" : "valid" };
        }
        return { ...row, status: "skipped" };
      }),
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entrada rápida"
        title="Importações"
        description="Baixe modelos, envie CSV/XLSX, revise a prévia e confirme apenas linhas válidas."
      />
      <CrudFeedback feedback={feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total" value={String(counts.total)} helper="Linhas na prévia." tone="info" />
        <StatCard label="Válidas" value={String(counts.valid)} helper="Prontas para confirmar." tone="success" />
        <StatCard label="Inválidas" value={String(counts.invalid)} helper="Com erros de validação." tone="danger" />
        <StatCard label="Ignoradas" value={String(counts.skipped)} helper="Não serão importadas." tone="warning" />
        <StatCard label="Importadas" value={String(counts.imported)} helper="Já gravadas no módulo final." tone="success" />
        <StatCard label="Falhas" value={String(counts.failed)} helper="Erro ao gravar." tone="danger" />
      </section>

      <SectionCard title="Como usar" description="Fluxo simples e seguro para o MVP.">
        <ul className="space-y-2 text-sm leading-6 text-ink-600">
          <li>Baixe o modelo, preencha os campos e importe o arquivo.</li>
          <li>Categorias e pessoas referenciadas precisam existir antes da importação.</li>
          <li>Linhas inválidas não serão importadas.</li>
          <li>Você poderá revisar a prévia antes de confirmar.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Modelos de planilha" description="CSV com cabeçalhos estáveis em português.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {activeImportTargets.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => downloadTemplate(item.target)}
              className="rounded-md border border-ink-950/10 bg-white p-4 text-left transition hover:border-mint-500 hover:text-mint-600"
            >
              <span className="block text-sm font-semibold text-ink-950">{item.label}</span>
              <span className="mt-1 block text-sm leading-6 text-ink-600">{item.description}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 border-t border-ink-950/10 pt-5">
          <p className="text-sm font-semibold text-ink-950">Em breve</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {futureImportTargets.map((item) => (
              <div
                key={item.target}
                className="rounded-md border border-dashed border-ink-950/10 bg-slate-50 p-4 text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="block text-sm font-semibold text-ink-950">{item.label}</span>
                  <TextBadge tone="neutral">Em breve</TextBadge>
                </div>
                <span className="mt-1 block text-sm leading-6 text-ink-600">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Nova importação" description="A gravação final só acontece depois da confirmação.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-sm font-medium text-ink-800">Módulo</span>
            <select
              className={`${inputClassName} mt-2`}
              value={target}
              onChange={(event) => {
                setTarget(event.target.value as ImportTarget);
                setRows([]);
                setBatchId(null);
              }}
            >
              {activeImportTargets.map((item) => (
                <option key={item.target} value={item.target}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-800">Arquivo CSV ou XLSX</span>
            <input
              className={`${inputClassName} mt-2`}
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="flex items-end gap-2">
            <ActionButton type="button" variant="secondary" onClick={() => downloadTemplate(target)}>
              Modelo
            </ActionButton>
            <ActionButton type="button" onClick={() => void handleParse()} disabled={working}>
              {workingAction === "parse" ? "Processando..." : "Prévia"}
            </ActionButton>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-600">
          Alvo selecionado: <strong>{config.label}</strong>. Neste MVP, categorias e pessoas
          informadas na planilha precisam existir antes da importação.
        </p>
      </SectionCard>

      <SectionCard title="Prévia" description="Revise erros e ignore linhas antes de confirmar.">
        {rows.length === 0 ? (
          <EmptyState title="Nenhum arquivo processado" description="Envie um CSV ou XLSX para ver a prévia das linhas aqui." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
              <ActionButton type="button" variant="secondary" onClick={() => void handleSavePreview()} disabled={working || !file}>
                {workingAction === "save" ? "Salvando..." : "Salvar prévia"}
              </ActionButton>
              <ActionButton type="button" onClick={() => void handleConfirm()} disabled={working || !batchId}>
                {workingAction === "confirm" ? "Importando..." : "Confirmar importação"}
              </ActionButton>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                  <tr>
                    <th className="px-4 py-3">Linha</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Erros</th>
                    <th className="px-4 py-3">Dados originais</th>
                    <th className="px-4 py-3">Dados mapeados</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-950/10">
                  {rows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="px-4 py-3 text-ink-600">{row.rowNumber}</td>
                      <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                      <td className="px-4 py-3 text-danger-600">
                        {row.errors.length ? row.errors.join(" | ") : "-"}
                      </td>
                      <td className="max-w-md px-4 py-3 text-ink-600">
                        <pre className="max-h-28 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
                          {JSON.stringify(row.raw, null, 2)}
                        </pre>
                      </td>
                      <td className="max-w-md px-4 py-3 text-ink-600">
                        <pre className="max-h-28 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
                          {JSON.stringify(row.mapped, null, 2)}
                        </pre>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionButton
                          type="button"
                          variant={row.status === "skipped" ? "secondary" : "danger"}
                          onClick={() => toggleSkip(row.rowNumber)}
                          disabled={row.status === "imported"}
                        >
                          {row.status === "skipped" ? "Importar" : "Ignorar"}
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Histórico de importações">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando importações...</p>
        ) : batches.length === 0 ? (
          <EmptyState title="Nenhuma importação salva" description="As prévias salvas e importações confirmadas aparecerão aqui." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Arquivo</th>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Linhas</th>
                  <th className="px-4 py-3">Erros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-4 py-3 font-medium text-ink-950">{batch.file_name}</td>
                    <td className="px-4 py-3 text-ink-600">{batch.target_type ?? batch.module}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(batch.created_at)}</td>
                    <td className="px-4 py-3"><StatusPill status={batch.status} /></td>
                    <td className="px-4 py-3 text-ink-600">{batch.valid_rows}/{batch.total_rows}</td>
                    <td className="px-4 py-3 text-ink-600">{batch.invalid_rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "valid" || status === "confirmed" || status === "imported"
      ? "success"
      : status === "invalid" || status === "failed"
        ? "danger"
        : status === "skipped"
          ? "warning"
          : "info";
  const label: Record<string, string> = {
    valid: "Válida",
    invalid: "Inválida",
    skipped: "Ignorada",
    imported: "Importada",
    failed: "Falhou",
    parsed: "Prévia salva",
    confirmed: "Confirmada",
    draft: "Rascunho",
  };
  return <TextBadge tone={tone}>{label[status] ?? status}</TextBadge>;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { createNote, deleteNote, listNotes, updateNote } from "@/features/notes/queries";
import { emptyNoteForm, noteEntityTypeOptions, noteToFormValues, type NoteFormValues, type NoteRow } from "@/features/notes/types";
import { ActionButton, CrudFeedback, FieldShell, inputClassName, Modal, TextBadge } from "@/features/shared/crud-ui";
import { formatDate } from "@/features/shared/format";
import { optionLabel } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";

type ModalState = { mode: "create"; item: null } | { mode: "edit"; item: NoteRow } | null;

export function NotesCrud() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const client = createClient();
    const { data: auth, error: authError } = await client.auth.getUser();
    if (authError || !auth.user) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      setLoading(false);
      return;
    }
    setUserId(auth.user.id);
    const { data, error } = await listNotes(client);
    if (error) setFeedback({ type: "error", message: error.message });
    else setNotes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesSearch = !term || [note.title, note.body].some((value) => value?.toLowerCase().includes(term));
      const matchesType = typeFilter === "all" || note.entity_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [notes, search, typeFilter]);

  async function handleSubmit(values: NoteFormValues) {
    if (!values.body.trim()) {
      setFeedback({ type: "error", message: "Escreva o conteúdo da nota." });
      return;
    }
    if (!userId) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      return;
    }

    setSaving(true);
    try {
      const client = createClient();
      const result = modal?.mode === "edit" ? await updateNote(client, modal.item.id, values) : await createNote(client, userId, values);
      if (result.error) {
        console.error("Erro técnico ao salvar nota:", result.error);
        setFeedback({ type: "error", message: result.error.message });
        return;
      }
      setFeedback({ type: "success", message: modal?.mode === "edit" ? "Nota atualizada." : "Nota criada." });
      setModal(null);
      await loadData();
    } catch (error) {
      console.error("Erro técnico ao salvar nota:", error);
      setFeedback({ type: "error", message: "Não foi possível salvar a nota." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(note: NoteRow) {
    if (!window.confirm("Excluir esta nota?")) return;
    const { error } = await deleteNote(createClient(), note.id);
    if (error) {
      console.error("Erro técnico ao excluir nota:", error);
      setFeedback({ type: "error", message: error.message });
    } else {
      setFeedback({ type: "success", message: "Nota excluída." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Memória operacional"
        title="Notas"
        description="Registre decisões, combinados e observações financeiras sem transformar tudo em tarefa."
        action={<ActionButton onClick={() => setModal({ mode: "create", item: null })}>Nova nota</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Notas" value={String(notes.length)} helper="Registros do usuário." tone="info" />
        <StatCard label="Fixadas" value={String(notes.filter((note) => note.pinned).length)} helper="Aparecem primeiro." tone="warning" />
        <StatCard label="Recentes" value={String(notes.filter((note) => daysSince(note.updated_at) <= 7).length)} helper="Atualizadas nos últimos 7 dias." tone="success" />
      </section>

      <SectionCard title="Lista de notas">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <input value={search} onChange={(event) => setSearch(event.target.value)} className={inputClassName} placeholder="Buscar por título ou conteúdo" />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={inputClassName}>
            <option value="all">Todos os contextos</option>
            {noteEntityTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        {loading ? (
          <p className="text-sm text-ink-600">Carregando notas...</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhuma nota" description="Crie notas simples para registrar decisões, riscos e combinados financeiros." />
        ) : (
          <div className="grid gap-3">
            {filtered.map((note) => (
              <article key={note.id} className="rounded-lg border border-ink-950/10 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink-950">{note.title || "Sem título"}</h3>
                      {note.pinned ? <TextBadge tone="warning">Fixada</TextBadge> : null}
                      <TextBadge>{optionLabel(noteEntityTypeOptions, note.entity_type)}</TextBadge>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">{note.body}</p>
                    <p className="mt-3 text-xs text-ink-500">Atualizada em {formatDate(note.updated_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", item: note })}>Editar</ActionButton>
                    <ActionButton variant="danger" onClick={() => void handleDelete(note)}>Excluir</ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {modal ? <NoteModal modal={modal} saving={saving} onClose={() => setModal(null)} onSubmit={(values) => void handleSubmit(values)} /> : null}
    </div>
  );
}

function NoteModal({ modal, saving, onClose, onSubmit }: { modal: ModalState; saving: boolean; onClose: () => void; onSubmit: (values: NoteFormValues) => void }) {
  const [values, setValues] = useState<NoteFormValues>(modal?.mode === "edit" ? noteToFormValues(modal.item) : emptyNoteForm);

  return (
    <Modal title={modal?.mode === "edit" ? "Editar nota" : "Nova nota"} description="Mantenha a nota curta e ligada a uma decisão prática." onClose={onClose}>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <FieldShell label="Título"><input className={inputClassName} value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} /></FieldShell>
        <FieldShell label="Contexto"><select className={inputClassName} value={values.entity_type} onChange={(event) => setValues({ ...values, entity_type: event.target.value })}>{noteEntityTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <FieldShell label="Conteúdo"><textarea required rows={7} className={inputClassName} value={values.body} onChange={(event) => setValues({ ...values, body: event.target.value })} /></FieldShell>
        <label className="flex items-center gap-2 text-sm font-medium text-ink-800"><input type="checkbox" checked={values.pinned} onChange={(event) => setValues({ ...values, pinned: event.target.checked })} /> Fixar nota</label>
        <div className="flex justify-end gap-2"><ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton><ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton></div>
      </form>
    </Modal>
  );
}

function daysSince(value: string) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

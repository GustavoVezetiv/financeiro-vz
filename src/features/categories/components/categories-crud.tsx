"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import {
  ActionButton,
  BooleanBadge,
  CategoryBadge,
  CrudFeedback,
  FieldShell,
  inputClassName,
  Modal,
  TitleButton,
} from "@/features/shared/crud-ui";
import { categoryTypeOptions, optionLabel } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import {
  createCategory,
  createDefaultCategories,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/features/categories/queries";
import {
  categoryToFormValues,
  emptyCategoryForm,
  type CategoryFormValues,
  type CategoryRow,
} from "@/features/categories/types";
import { createClient } from "@/lib/supabase/client";

type ModalState =
  | { mode: "create"; category: null }
  | { mode: "edit"; category: CategoryRow }
  | null;

const categoryIconSuggestions = [
  { label: "Casa", value: "casa" },
  { label: "Carro", value: "carro" },
  { label: "Cartão", value: "cartao" },
  { label: "Comida", value: "comida" },
  { label: "Mercado", value: "mercado" },
  { label: "Saúde", value: "saude" },
  { label: "Estudo", value: "estudo" },
  { label: "Trabalho", value: "trabalho" },
  { label: "Lazer", value: "lazer" },
  { label: "Assinatura", value: "assinatura" },
  { label: "Família", value: "familia" },
  { label: "Viagem", value: "viagem" },
  { label: "Outros", value: "outros" },
];

export function CategoriesCrud() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const filteredCategories = useMemo(() => {
    if (typeFilter === "all") {
      return categories;
    }

    return categories.filter((category) => category.type === typeFilter);
  }, [categories, typeFilter]);

  async function loadCategories() {
    setLoading(true);
    setFeedback(null);

    try {
      const client = createClient();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError || !user) {
        setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
        return;
      }

      setUserId(user.id);

      const { data, error } = await listCategories(client);

      if (error) {
        setFeedback({ type: "error", message: error.message });
        return;
      }

      setCategories(data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao carregar categorias.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function handleSubmit(values: CategoryFormValues) {
    if (!values.name.trim()) {
      setFeedback({ type: "error", message: "Informe o nome da categoria." });
      return;
    }

    if (!userId) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const client = createClient();
      const result =
        modal?.mode === "edit"
          ? await updateCategory(client, modal.category.id, values)
          : await createCategory(client, userId, values);

      if (result.error) {
        setFeedback({ type: "error", message: result.error.message });
        return;
      }

      setFeedback({
        type: "success",
        message: modal?.mode === "edit" ? "Categoria atualizada." : "Categoria criada.",
      });
      setModal(null);
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: CategoryRow) {
    if (!window.confirm(`Excluir ${category.name}?`)) {
      return;
    }

    const { error } = await deleteCategory(createClient(), category.id);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setFeedback({ type: "success", message: "Categoria excluída." });
    await loadCategories();
  }

  async function handleCreateDefaults() {
    setSaving(true);
    setFeedback(null);

    try {
      const { error } = await createDefaultCategories(createClient());

      if (error) {
        setFeedback({ type: "error", message: error.message });
        return;
      }

      setFeedback({ type: "success", message: "Categorias padrão criadas para seu usuário." });
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Classificação"
        title="Categorias"
        description="Organize contas, receitas, compras, metas e futuros lançamentos."
        action={<ActionButton onClick={() => setModal({ mode: "create", category: null })}>Nova categoria</ActionButton>}
      />

      <CrudFeedback feedback={feedback} />

      <SectionCard title="Filtros" description="Filtre categorias pelo tipo de uso.">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className={inputClassName}
        >
          <option value="all">Todos os tipos</option>
          {categoryTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </SectionCard>

      <SectionCard title="Categorias cadastradas">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando categorias...</p>
        ) : categories.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              title="Nenhuma categoria cadastrada"
              description="Crie categorias próprias ou gere a lista padrão para começar."
            />
            <ActionButton onClick={() => void handleCreateDefaults()} disabled={saving}>
              {saving ? "Criando..." : "Criar categorias padrão"}
            </ActionButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Cor</th>
                  <th className="px-4 py-3">Ícone</th>
                  <th className="px-4 py-3">Padrão</th>
                  <th className="px-4 py-3">Ativa</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3">
                      <TitleButton onClick={() => setModal({ mode: "edit", category })}>
                        {category.name}
                      </TitleButton>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {optionLabel(categoryTypeOptions, category.type)}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={category} />
                    </td>
                    <td className="px-4 py-3 text-ink-600">{category.icon ?? "-"}</td>
                    <td className="px-4 py-3">
                      <BooleanBadge value={category.is_default} />
                    </td>
                    <td className="px-4 py-3">
                      <BooleanBadge value={category.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          variant="secondary"
                          onClick={() => setModal({ mode: "edit", category })}
                        >
                          Editar
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDelete(category)}>
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

      {modal ? (
        <CategoryModal
          modal={modal}
          saving={saving}
          onSubmit={(values) => void handleSubmit(values)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function CategoryModal({
  modal,
  saving,
  onSubmit,
  onClose,
}: {
  modal: ModalState;
  saving: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<CategoryFormValues>(
    modal?.mode === "edit" ? categoryToFormValues(modal.category) : emptyCategoryForm,
  );

  return (
    <Modal
      title={modal?.mode === "edit" ? "Editar categoria" : "Nova categoria"}
      description="Categorias são sempre vinculadas ao seu usuário."
      onClose={onClose}
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
      >
        <FieldShell label="Nome">
          <input
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className={inputClassName}
            required
          />
        </FieldShell>

        <FieldShell label="Tipo">
          <select
            value={values.type}
            onChange={(event) => setValues({ ...values, type: event.target.value })}
            className={inputClassName}
          >
            {categoryTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Cor">
          <input
            value={values.color}
            onChange={(event) => setValues({ ...values, color: event.target.value })}
            type="color"
            className="h-11 w-full rounded-md border border-ink-950/10 bg-white p-1"
          />
        </FieldShell>

        <FieldShell label="Ícone">
          <input
            value={values.icon}
            onChange={(event) => setValues({ ...values, icon: event.target.value })}
            placeholder="Ex.: casa, cartao, mercado"
            className={inputClassName}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryIconSuggestions.map((suggestion) => (
              <button
                key={suggestion.value}
                type="button"
                onClick={() => setValues({ ...values, icon: suggestion.value })}
                className="rounded-full border border-ink-950/10 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-mint-500 hover:text-mint-600"
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </FieldShell>

        <FieldShell label="Categoria padrão">
          <select
            value={String(values.is_default)}
            onChange={(event) => setValues({ ...values, is_default: event.target.value === "true" })}
            className={inputClassName}
          >
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        </FieldShell>

        <FieldShell label="Status">
          <select
            value={String(values.is_active)}
            onChange={(event) => setValues({ ...values, is_active: event.target.value === "true" })}
            className={inputClassName}
          >
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </select>
        </FieldShell>

        <div className="flex justify-end gap-2 md:col-span-2">
          <ActionButton type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </ActionButton>
          <ActionButton type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getProfile, upsertProfile } from "@/features/settings/queries";
import { currencyOptions, profileToFormValues, timezoneOptions, type ProfileRow, type SettingsFormValues } from "@/features/settings/types";
import { ActionButton, CrudFeedback, FieldShell, inputClassName } from "@/features/shared/crud-ui";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";

export function SettingsPanel() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [values, setValues] = useState<SettingsFormValues>(profileToFormValues(null));
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    setEmail(auth.user.email ?? null);
    const { data, error } = await getProfile(client, auth.user.id);
    if (error) {
      setFeedback({ type: "error", message: error.message });
    } else {
      setProfile(data);
      setValues(profileToFormValues(data));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      return;
    }
    const monthStartDay = Number(values.month_start_day);
    if (!Number.isInteger(monthStartDay) || monthStartDay < 1 || monthStartDay > 28) {
      setFeedback({ type: "error", message: "O dia inicial do mês deve estar entre 1 e 28." });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await upsertProfile(createClient(), userId, values);
      if (error) {
        console.error("Erro técnico ao salvar configurações:", error);
        setFeedback({ type: "error", message: error.message });
        return;
      }
      setProfile(data);
      setValues(profileToFormValues(data));
      setFeedback({ type: "success", message: "Configurações salvas." });
    } catch (error) {
      console.error("Erro técnico ao salvar configurações:", error);
      setFeedback({ type: "error", message: "Não foi possível salvar as configurações." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Ajustes básicos do perfil e do comportamento financeiro do app."
      />
      <CrudFeedback feedback={feedback} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Conta" value={email ?? "-"} helper="Email autenticado no Supabase." tone="info" />
        <StatCard label="Moeda" value={profile?.currency ?? values.currency} helper="Usada nas telas financeiras." tone="success" />
        <StatCard label="Fuso horário" value={profile?.timezone ?? values.timezone} helper="Base para datas e meses." tone="neutral" />
      </section>

      <SectionCard title="Perfil financeiro" description="Essas preferências ficam vinculadas ao seu usuário e protegidas por RLS.">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando configurações...</p>
        ) : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <FieldShell label="Nome de exibição"><input className={inputClassName} value={values.display_name} onChange={(event) => setValues({ ...values, display_name: event.target.value })} /></FieldShell>
            <FieldShell label="Email"><input className={inputClassName} value={email ?? ""} disabled /></FieldShell>
            <FieldShell label="Moeda"><select className={inputClassName} value={values.currency} onChange={(event) => setValues({ ...values, currency: event.target.value })}>{currencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
            <FieldShell label="Fuso horário"><select className={inputClassName} value={values.timezone} onChange={(event) => setValues({ ...values, timezone: event.target.value })}>{timezoneOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
            <FieldShell label="Dia inicial do mês"><input min="1" max="28" type="number" className={inputClassName} value={values.month_start_day} onChange={(event) => setValues({ ...values, month_start_day: event.target.value })} /></FieldShell>
            <div className="flex items-end justify-end"><ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</ActionButton></div>
          </form>
        )}
      </SectionCard>

      <SectionCard title="Ambiente" description="Resumo técnico para beta privado.">
        <div className="grid gap-3 text-sm text-ink-700 md:grid-cols-2">
          <p><strong className="text-ink-950">Autenticação:</strong> Supabase Auth</p>
          <p><strong className="text-ink-950">Banco:</strong> Supabase PostgreSQL com RLS</p>
          <p><strong className="text-ink-950">Deploy:</strong> Vercel</p>
          <p><strong className="text-ink-950">Escopo:</strong> Web privado, sem integrações externas</p>
        </div>
      </SectionCard>
    </div>
  );
}

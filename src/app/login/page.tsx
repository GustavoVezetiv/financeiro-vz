import Link from "next/link";

import { StatusBadge } from "@/components/ui/status-badge";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-ink-950/10 bg-white p-8 shadow-soft">
        <StatusBadge tone="neutral">Auth pendente</StatusBadge>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-950">
          Entrar no Financeiro VZ
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          Esta tela reserva o espaço para Supabase Auth na próxima fase. Nenhum login
          real foi implementado neste scaffold.
        </p>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink-800">E-mail</span>
            <input
              disabled
              placeholder="voce@email.com"
              className="mt-2 w-full rounded-md border border-ink-950/10 bg-slate-50 px-3 py-2.5 text-sm text-ink-600 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-800">Senha</span>
            <input
              disabled
              type="password"
              placeholder="••••••••"
              className="mt-2 w-full rounded-md border border-ink-950/10 bg-slate-50 px-3 py-2.5 text-sm text-ink-600 outline-none"
            />
          </label>
        </div>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex w-full items-center justify-center rounded-md bg-ink-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          Continuar para o protótipo
        </Link>
      </section>
    </main>
  );
}


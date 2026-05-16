import { AuthForm } from "@/components/auth/auth-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-ink-950/10 bg-white p-8 shadow-soft">
        <StatusBadge tone={supabaseConfigured ? "success" : "warning"}>
          {supabaseConfigured ? "Supabase Auth" : "Configuração pendente"}
        </StatusBadge>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-950">
          Entrar no Financeiro VZ
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          Use e-mail e senha para entrar ou criar sua conta. O dashboard só fica
          acessível para usuários autenticados.
        </p>

        <AuthForm isConfigured={supabaseConfigured} />
      </section>
    </main>
  );
}

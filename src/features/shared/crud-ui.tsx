import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

type FieldShellProps = {
  label: string;
  children: React.ReactNode;
};

export function FieldShell({ label, children }: FieldShellProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

export const inputClassName =
  "w-full rounded-md border border-ink-950/10 bg-white px-3 py-2.5 text-sm text-ink-950 outline-none transition focus:border-mint-500 focus:ring-4 focus:ring-mint-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-ink-600";

export function CrudFeedback({
  feedback,
}: {
  feedback: { type: "success" | "error"; message: string } | null;
}) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-md border px-4 py-3 text-sm leading-6",
        feedback.type === "success"
          ? "border-mint-600/20 bg-mint-100 text-mint-600"
          : "border-danger-600/20 bg-danger-100 text-danger-600",
      ].join(" ")}
    >
      {feedback.message}
    </div>
  );
}

type ModalProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function Modal({ title, description, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/45 px-4 py-6">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-ink-950/10 bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-ink-950/10 px-3 py-2 text-sm font-semibold text-ink-600 transition hover:border-danger-600 hover:text-danger-600"
          >
            Fechar
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  const className =
    variant === "primary"
      ? "bg-ink-950 text-white hover:bg-ink-800"
      : variant === "danger"
        ? "border border-danger-600/20 bg-danger-100 text-danger-600 hover:border-danger-600"
        : "border border-ink-950/10 bg-white text-ink-950 hover:border-mint-500 hover:text-mint-600";

  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        className,
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

export function BooleanBadge({ value }: { value: boolean }) {
  return <StatusBadge tone={value ? "success" : "neutral"}>{value ? "Sim" : "Não"}</StatusBadge>;
}

export function TextBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: StatusTone }) {
  return <StatusBadge tone={tone}>{children}</StatusBadge>;
}


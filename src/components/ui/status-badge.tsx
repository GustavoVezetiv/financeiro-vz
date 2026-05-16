export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusTone;
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClassName[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

const toneClassName: Record<StatusTone, string> = {
  neutral: "bg-ink-950/6 text-ink-600",
  success: "bg-mint-100 text-mint-600",
  warning: "bg-amberRisk-100 text-amberRisk-500",
  danger: "bg-danger-100 text-danger-600",
  info: "bg-sky-100 text-sky-700",
};


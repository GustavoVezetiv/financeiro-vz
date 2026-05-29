"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SectionCard } from "@/components/ui/section-card";
import { FieldShell, inputClassName } from "@/features/shared/crud-ui";
import {
  type PeriodValue,
  periodOptions,
  updatePeriodPreset,
  type PeriodPreset,
} from "@/features/shared/period";

type PeriodFilterProps = {
  value: PeriodValue;
  onChange?: (value: PeriodValue) => void;
  description?: string;
  syncUrl?: boolean;
};

export function PeriodFilter({
  value,
  onChange,
  description = "Escolha o recorte de datas usado na lista e nos cards de resumo.",
  syncUrl = false,
}: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function emit(nextValue: PeriodValue) {
    onChange?.(nextValue);

    if (!syncUrl) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextValue.preset);

    if (nextValue.preset === "custom") {
      params.set("start", nextValue.startDate);
      params.set("end", nextValue.endDate);
    } else {
      params.delete("start");
      params.delete("end");
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <SectionCard title="Período" description={description}>
      <div className="grid gap-3 md:grid-cols-3">
        <FieldShell label="Ver registros de">
          <select
            className={inputClassName}
            value={value.preset}
            onChange={(event) => emit(updatePeriodPreset(value, event.target.value as PeriodPreset))}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        {value.preset === "custom" ? (
          <>
            <FieldShell label="Data inicial">
              <input
                className={inputClassName}
                type="date"
                value={value.startDate}
                onChange={(event) => emit({ ...value, startDate: event.target.value })}
              />
            </FieldShell>
            <FieldShell label="Data final">
              <input
                className={inputClassName}
                type="date"
                value={value.endDate}
                onChange={(event) => emit({ ...value, endDate: event.target.value })}
              />
            </FieldShell>
          </>
        ) : null}
      </div>
    </SectionCard>
  );
}

import type { Note } from "@/lib/supabase/types";

export type NoteRow = Note;

export type NoteFormValues = {
  title: string;
  body: string;
  entity_type: string;
  pinned: boolean;
};

export const noteEntityTypeOptions = [
  { value: "general", label: "Geral" },
  { value: "decision", label: "Decisão" },
  { value: "cash_flow", label: "Fluxo de caixa" },
  { value: "reimbursement", label: "Reembolso" },
  { value: "payment_plan", label: "Plano de pagamento" },
  { value: "planned_purchase", label: "Compra planejada" },
];

export const emptyNoteForm: NoteFormValues = {
  title: "",
  body: "",
  entity_type: "general",
  pinned: false,
};

export function noteToFormValues(note: NoteRow): NoteFormValues {
  return {
    title: note.title ?? "",
    body: note.body,
    entity_type: note.entity_type,
    pinned: note.pinned,
  };
}

import type { EventStatus } from "../lib/types";
import { STATUS_LABEL } from "../lib/types";

const DOT_CLASS: Record<EventStatus, string> = {
  draft: "bg-status-draft",
  confirmed: "bg-status-confirmed",
  done: "bg-status-done",
};

const WRAP_CLASS: Record<EventStatus, string> = {
  draft: "text-status-draft bg-status-draft-bg",
  confirmed: "text-status-confirmed bg-status-confirmed-bg",
  done: "text-status-done bg-status-done-bg",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold uppercase tracking-wide ${WRAP_CLASS[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

import { useState } from "react";
import type { EquipmentItem, TeamMember } from "../lib/types";

interface Props {
  item: EquipmentItem;
  /** Seřazení podle jména — pro výběr v <select>. */
  team: TeamMember[];
  onSaveHolder: (holderId: string | null) => void;
  onSaveNote: (note: string) => void;
}

/**
 * Karta jednoho kusu vybavení (nabíječka, Kesr, vysílačka) — pro
 * přepravky (20 kusů) je místo karet tabulka v EquipmentPage, karty by
 * tam byly nepřehledné. "U koho" a poznámka se ukládají rovnou (bez
 * zvláštního tlačítka Upravit) — mění se často, tak ať to jde rychle.
 */
export function EquipmentCard({ item, team, onSaveHolder, onSaveNote }: Props) {
  const [note, setNote] = useState(item.note);

  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-5 shadow-[var(--shadow)]">
      <h3 className="font-display text-lg font-bold">{item.name}</h3>

      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-soft">U koho</span>
        <select
          value={item.holderId ?? ""}
          onChange={(e) => onSaveHolder(e.target.value || null)}
          className="rounded-lg border border-line bg-bg px-3 py-2"
        >
          <option value="">— nikdo / sklad —</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="font-semibold text-ink-soft">Poznámka</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== item.note) onSaveNote(note);
          }}
          placeholder="např. potřebuje nabít / je v opravě"
          className="rounded-lg border border-line bg-bg px-3 py-2"
        />
      </label>
    </div>
  );
}

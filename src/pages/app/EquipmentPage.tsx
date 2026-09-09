import { useMemo, useState } from "react";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { EquipmentCategory, EquipmentItem, NewEquipmentItem, TeamMember } from "../../lib/types";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CATEGORY_LABEL, EQUIPMENT_COUNTS, equipmentItemName } from "../../lib/types";
import { EquipmentCard } from "../../components/EquipmentCard";

const CARD_CATEGORIES = EQUIPMENT_CATEGORIES.filter((c) => c !== "crate");

export function EquipmentPage() {
  const { data: equipment, loading } = useCollection<EquipmentItem>("equipment", [orderBy("sortIndex", "asc")]);
  const { data: team } = useCollection<TeamMember>("team");

  const sortedTeam = useMemo(() => [...team].sort((a, b) => a.name.localeCompare(b.name, "cs")), [team]);

  // Předvyplněné prázdné pole pro každou kategorii (i tu, co v `equipment`
  // ještě nemá žádnou položku) — `.get(category)` tak nikdy nevrátí
  // `undefined` a nemusí se nahrazovat novým `[]` při každém renderu
  // (to by rozbilo memoizaci níže). Řazení podle `sortIndex` se dělá
  // jednou tady, ne opakovaně při každém čtení (a hlavně ne mutací
  // sdíleného pole přímo v JSX).
  const byCategory = useMemo(() => {
    const map = new Map<EquipmentCategory, EquipmentItem[]>();
    for (const category of EQUIPMENT_CATEGORIES) map.set(category, []);
    for (const item of equipment) map.get(item.category)?.push(item);
    for (const list of map.values()) list.sort((a, b) => a.sortIndex - b.sortIndex);
    return map;
  }, [equipment]);

  async function saveHolder(id: string, holderId: string | null) {
    await updateDoc(doc(db, "equipment", id), { holderId });
  }

  async function saveNote(id: string, note: string) {
    await updateDoc(doc(db, "equipment", id), { note });
  }

  // Počet kusů v každé kategorii je pevně daný (EQUIPMENT_COUNTS) — appka
  // jednotlivé kusy sama nezakládá volně, jen tímhle tlačítkem doplní
  // chybějící čísla do daného počtu (deterministické ID "kategorie-číslo",
  // ať je to bezpečné spustit i opakovaně).
  async function fillMissing(category: EquipmentCategory) {
    const count = EQUIPMENT_COUNTS[category];
    const existing = new Set((byCategory.get(category) ?? []).map((e) => e.sortIndex));
    const missing = Array.from({ length: count }, (_, i) => i + 1).filter((n) => !existing.has(n));
    if (missing.length === 0) return;

    const batch = writeBatch(db);
    missing.forEach((n) => {
      const data: NewEquipmentItem = {
        category,
        name: equipmentItemName(category, n),
        sortIndex: n,
        holderId: null,
        note: "",
      };
      batch.set(doc(db, "equipment", `${category}-${n}`), data);
    });
    await batch.commit();
  }

  const crates = useMemo(() => byCategory.get("crate") ?? [], [byCategory]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Vybavení</h1>
        <p className="mt-1 text-sm text-ink-soft">
          U každého kusu je vidět, kdo ho má aktuálně u sebe a zajistí jeho vrácení.
        </p>
      </div>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : (
        <>
          {CARD_CATEGORIES.map((category) => (
            <EquipmentSection
              key={category}
              category={category}
              items={byCategory.get(category) ?? []}
              team={sortedTeam}
              onSaveHolder={saveHolder}
              onSaveNote={saveNote}
              onFillMissing={() => fillMissing(category)}
            />
          ))}

          <section className="rounded-2xl border border-line bg-bg-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">
                {EQUIPMENT_CATEGORY_LABEL.crate} (1–{EQUIPMENT_COUNTS.crate})
              </h2>
              {crates.length < EQUIPMENT_COUNTS.crate && (
                <button
                  onClick={() => fillMissing("crate")}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
                >
                  Doplnit chybějící přepravky ({EQUIPMENT_COUNTS.crate - crates.length})
                </button>
              )}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-soft">
                    <th className="w-16 py-2 pr-3 font-semibold">Číslo</th>
                    <th className="w-56 py-2 pr-3 font-semibold">U koho</th>
                    <th className="py-2 font-semibold">Poznámka</th>
                  </tr>
                </thead>
                <tbody>
                  {crates.map((crate) => (
                    <CrateRow
                      key={crate.id}
                      crate={crate}
                      team={sortedTeam}
                      onSaveHolder={(holderId) => saveHolder(crate.id, holderId)}
                      onSaveNote={(note) => saveNote(crate.id, note)}
                    />
                  ))}
                </tbody>
              </table>
              {crates.length === 0 && (
                <p className="py-4 text-center text-ink-soft">
                  Zatím žádná přepravka — klikněte na „Doplnit chybějící přepravky" výše.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function EquipmentSection({
  category,
  items,
  team,
  onSaveHolder,
  onSaveNote,
  onFillMissing,
}: {
  category: EquipmentCategory;
  items: EquipmentItem[];
  team: TeamMember[];
  onSaveHolder: (id: string, holderId: string | null) => void;
  onSaveNote: (id: string, note: string) => void;
  onFillMissing: () => void;
}) {
  const count = EQUIPMENT_COUNTS[category];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">
          {EQUIPMENT_CATEGORY_LABEL[category]} ({count})
        </h2>
        {items.length < count && (
          <button
            onClick={onFillMissing}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Doplnit chybějící ({count - items.length})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-ink-soft">
          Zatím žádný záznam — klikněte na „Doplnit chybějící" výše.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <EquipmentCard
              key={item.id}
              item={item}
              team={team}
              onSaveHolder={(holderId) => onSaveHolder(item.id, holderId)}
              onSaveNote={(note) => onSaveNote(item.id, note)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CrateRow({
  crate,
  team,
  onSaveHolder,
  onSaveNote,
}: {
  crate: EquipmentItem;
  team: TeamMember[];
  onSaveHolder: (holderId: string | null) => void;
  onSaveNote: (note: string) => void;
}) {
  const [note, setNote] = useState(crate.note);

  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2 pr-3 font-mono-nums font-semibold">{crate.sortIndex}</td>
      <td className="py-2 pr-3">
        <select
          value={crate.holderId ?? ""}
          onChange={(e) => onSaveHolder(e.target.value || null)}
          className="w-full rounded-lg border border-line bg-bg px-2 py-1.5"
        >
          <option value="">— nikdo / sklad —</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => {
            if (note !== crate.note) onSaveNote(note);
          }}
          placeholder="např. zůstala na Vřesině, dovezou příští týden"
          className="w-full rounded-lg border border-line bg-bg px-2 py-1.5"
        />
      </td>
    </tr>
  );
}

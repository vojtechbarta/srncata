import { useMemo, useState } from "react";
import { addDoc, collection, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { EquipmentCategory, EquipmentItem, NewEquipmentItem, TeamMember } from "../../lib/types";
import { CRATE_COUNT, EQUIPMENT_CATEGORIES, EQUIPMENT_CATEGORY_LABEL } from "../../lib/types";
import { EquipmentCard } from "../../components/EquipmentCard";

const CARD_CATEGORIES = EQUIPMENT_CATEGORIES.filter((c) => c !== "crate");

export function EquipmentPage() {
  const { data: equipment, loading } = useCollection<EquipmentItem>("equipment", [orderBy("sortIndex", "asc")]);
  const { data: team } = useCollection<TeamMember>("team");

  const sortedTeam = useMemo(() => [...team].sort((a, b) => a.name.localeCompare(b.name, "cs")), [team]);

  // Předvyplněné prázdné pole pro každou kategorii (i tu, co v `equipment`
  // ještě nemá žádnou položku) — `.get(category)` tak nikdy nevrátí
  // `undefined` a nemusí se nahrazovat novým `[]` při každém renderu
  // (to by rozbilo memoizaci níže i `useMemo` na chybějící přepravky).
  // Řazení podle `sortIndex` se dělá jednou tady, ne opakovaně při
  // každém čtení (a hlavně ne mutací sdíleného pole přímo v JSX).
  const byCategory = useMemo(() => {
    const map = new Map<EquipmentCategory, EquipmentItem[]>();
    for (const category of EQUIPMENT_CATEGORIES) map.set(category, []);
    for (const item of equipment) map.get(item.category)?.push(item);
    for (const list of map.values()) list.sort((a, b) => a.sortIndex - b.sortIndex);
    return map;
  }, [equipment]);

  async function addItem(category: EquipmentCategory, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = byCategory.get(category) ?? [];
    const nextIndex = existing.length > 0 ? Math.max(...existing.map((e) => e.sortIndex)) + 1 : 1;
    const data: NewEquipmentItem = { category, name: trimmed, sortIndex: nextIndex, holderId: null, note: "" };
    await addDoc(collection(db, "equipment"), data);
  }

  async function saveHolder(id: string, holderId: string | null) {
    await updateDoc(doc(db, "equipment", id), { holderId });
  }

  async function saveNote(id: string, note: string) {
    await updateDoc(doc(db, "equipment", id), { note });
  }

  const crates = useMemo(() => byCategory.get("crate") ?? [], [byCategory]);
  const missingCrateNumbers = useMemo(() => {
    const existing = new Set(crates.map((c) => c.sortIndex));
    return Array.from({ length: CRATE_COUNT }, (_, i) => i + 1).filter((n) => !existing.has(n));
  }, [crates]);

  async function fillMissingCrates() {
    if (missingCrateNumbers.length === 0) return;
    const batch = writeBatch(db);
    missingCrateNumbers.forEach((n) => {
      const data: NewEquipmentItem = {
        category: "crate",
        name: String(n),
        sortIndex: n,
        holderId: null,
        note: "",
      };
      batch.set(doc(db, "equipment", `crate-${n}`), data);
    });
    await batch.commit();
  }

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
              onAdd={(name) => addItem(category, name)}
            />
          ))}

          <section className="rounded-2xl border border-line bg-bg-raised p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold">
                {EQUIPMENT_CATEGORY_LABEL.crate} (1–{CRATE_COUNT})
              </h2>
              {missingCrateNumbers.length > 0 && (
                <button
                  onClick={fillMissingCrates}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
                >
                  Doplnit chybějící přepravky ({missingCrateNumbers.length})
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
  onAdd,
}: {
  category: EquipmentCategory;
  items: EquipmentItem[];
  team: TeamMember[];
  onSaveHolder: (id: string, holderId: string | null) => void;
  onSaveNote: (id: string, note: string) => void;
  onAdd: (name: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await onAdd(newName);
      setNewName("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-lg font-bold">{EQUIPMENT_CATEGORY_LABEL[category]}</h2>

      {items.length > 0 && (
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

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`Přidat další (${EQUIPMENT_CATEGORY_LABEL[category].toLowerCase()})`}
          className="w-full max-w-sm rounded-lg border border-dashed border-line bg-bg px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
        >
          Přidat
        </button>
      </div>
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

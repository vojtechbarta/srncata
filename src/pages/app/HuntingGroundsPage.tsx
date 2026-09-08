import { useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection } from "../../lib/useCollection";
import { OMS_OPTIONS, type HuntingGround, type NewHuntingGround, type Oms } from "../../lib/types";
import { HuntingGroundCard } from "../../components/HuntingGroundCard";

const emptyForm: NewHuntingGround = {
  name: "",
  district: "",
  oms: "",
  mapLink: "",
  wardenName: "",
  wardenPhone: "",
  note: "",
};

export function HuntingGroundsPage() {
  const { data: grounds, loading } = useCollection<HuntingGround>("huntingGrounds");
  const [form, setForm] = useState<NewHuntingGround>(emptyForm);
  const [adding, setAdding] = useState(false);

  // Řazeno podle jména, ne podle pořadí v databázi — ať se v delším
  // seznamu snáz hledá (stejný vzor jako u pilotů).
  const sortedGrounds = useMemo(
    () => [...grounds].sort((a, b) => a.name.localeCompare(b.name, "cs")),
    [grounds],
  );

  async function saveGround(id: string, data: NewHuntingGround) {
    await updateDoc(doc(db, "huntingGrounds", id), data);
  }

  async function addGround() {
    if (!form.name.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "huntingGrounds"), form);
      setForm(emptyForm);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Honitby</h1>
      <p className="text-sm text-ink-soft">
        Evidence honiteb a kontaktů na hospodáře — ať je při plánování akce po ruce, komu zavolat.
      </p>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : sortedGrounds.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
          Zatím žádná honitba — přidejte první níže.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedGrounds.map((ground) => (
            <HuntingGroundCard
              key={ground.id}
              ground={ground}
              onSave={(data) => saveGround(ground.id, data)}
              onDelete={() => deleteDoc(doc(db, "huntingGrounds", ground.id))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-4">
        <p className="text-sm font-semibold text-ink-soft">Přidat honitbu</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jméno honitby"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            placeholder="Okres"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <select
            value={form.oms}
            onChange={(e) => setForm({ ...form, oms: e.target.value as Oms | "" })}
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          >
            <option value="">OMS (nepovinné)</option>
            {OMS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={form.mapLink}
            onChange={(e) => setForm({ ...form, mapLink: e.target.value })}
            placeholder="Odkaz na mapu (nepovinné)"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            value={form.wardenName}
            onChange={(e) => setForm({ ...form, wardenName: e.target.value })}
            placeholder="Jméno hospodáře"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            value={form.wardenPhone}
            onChange={(e) => setForm({ ...form, wardenPhone: e.target.value })}
            placeholder="Telefon na hospodáře"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Poznámka"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        <button
          onClick={addGround}
          disabled={adding || !form.name.trim()}
          className="self-start rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Přidat
        </button>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { useCollection } from "../../lib/useCollection";
import type { NewTeamMember, RescueEvent, TeamMember, UnavailabilityWindow } from "../../lib/types";
import { PilotCard } from "../../components/PilotCard";
import { recomputePublicAvailability } from "../../lib/publicAvailability";

const emptyForm: NewTeamMember = {
  name: "",
  email: "",
  phone: "",
  address: "",
  unavailability: [],
};

/** Poslední slovo ze jména — u "Jméno Příjmení" je to příjmení, pro řazení. */
function surname(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

// Jen hrubá kontrola tvaru (ne přesně podle RFC) — hlavně odchytit
// překlepy typu chybějící zavináč/doména, než se z nich stane pilot,
// co se nikdy nepřihlásí.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PilotsPage() {
  const { user, isAdmin } = useAuth();
  const { data: pilots, loading } = useCollection<TeamMember>("team");
  const { data: events } = useCollection<RescueEvent>("events");

  // Řazeno podle příjmení (poslední slovo ve jméně), ne podle pořadí
  // v databázi — ať se v delším seznamu snáz hledá.
  const sortedPilots = useMemo(
    () => [...pilots].sort((a, b) => surname(a.name).localeCompare(surname(b.name), "cs")),
    [pilots],
  );
  const [form, setForm] = useState<NewTeamMember>(emptyForm);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  /** ID dokumentu je e-mail — když se e-mail u existujícího pilota změní,
   *  musíme starý dokument smazat a založit nový pod novým ID. E-mail se
   *  vždy normalizuje na malá písmena: doc ID musí přesně (case-sensitive)
   *  odpovídat e-mailu z Google přihlášení (viz firestore.rules), a Google
   *  ho vrací malými písmeny — jinak by pilot zadaný s velkým písmenem
   *  zůstal po přihlášení nahlášený jako "není v týmu" bez jakékoli
   *  nápovědy proč. */
  async function savePilot(originalEmail: string | null, data: NewTeamMember) {
    const email = data.email.trim().toLowerCase();
    if (!email) {
      setError("E-mail je povinný — bez něj se pilot nedostane do přihlášení.");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError(`"${data.email}" nevypadá jako platný e-mail (např. jmeno@gmail.com).`);
      return;
    }
    setError("");
    await setDoc(doc(db, "team", email), { ...data, email });
    if (originalEmail && originalEmail !== email) {
      await deleteDoc(doc(db, "team", originalEmail));
    }
  }

  /** Přidá období nedostupnosti a zároveň vyprázdní pole "Pilot" u akcí,
   * které se s ním kryjí (uživatel to předtím potvrdil v PilotCard). */
  async function addUnavailability(
    pilot: TeamMember,
    window: UnavailabilityWindow,
    conflictingEventIds: string[],
  ) {
    const now = new Date().toISOString();
    await Promise.all(
      conflictingEventIds.map((id) => updateDoc(doc(db, "events", id), { pilot: "", updatedAt: now })),
    );
    await updateDoc(doc(db, "team", pilot.id), {
      unavailability: [...(pilot.unavailability ?? []), window],
    });
    // "Fire and forget" — viz komentář u recomputePublicAvailability.
    recomputePublicAvailability().catch((err) => console.error("Přepočet veřejné dostupnosti selhal:", err));
  }

  async function removeUnavailability(pilot: TeamMember, windowId: string) {
    await updateDoc(doc(db, "team", pilot.id), {
      unavailability: (pilot.unavailability ?? []).filter((w) => w.id !== windowId),
    });
    recomputePublicAvailability().catch((err) => console.error("Přepočet veřejné dostupnosti selhal:", err));
  }

  async function addPilot() {
    if (!form.email.trim()) {
      setError("Vyplň aspoň e-mail nového pilota.");
      return;
    }
    setAdding(true);
    setError("");
    try {
      await savePilot(null, form);
      setForm(emptyForm);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Piloti</h1>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : (
        <div className="flex flex-col gap-5">
          {sortedPilots.map((pilot) => {
            // Kompletně odebrat z týmu smí jen admin, nebo pilot sám sebe
            // (viz firestore.rules) — přidat/upravit/nedostupnost pořád
            // smí kdokoli z týmu, o to se tahle podmínka nestará.
            const canDelete = isAdmin || user?.email === pilot.email;
            return (
              <div key={pilot.id} className="w-full sm:max-w-[80%]">
                <PilotCard
                  pilot={pilot}
                  // Primárně párování podle pilotId (nezávislé na pozdějším
                  // přejmenování pilota — viz EventForm). Starší akce, které
                  // vznikly předtím, než se pilotId začal ukládat, ještě
                  // pilotId nemají — u nich se poznají aspoň podle jména.
                  events={events.filter((e) =>
                    e.pilotId ? e.pilotId === pilot.id : pilot.name && e.pilot === pilot.name,
                  )}
                  onSave={(data) => savePilot(pilot.email, data)}
                  onDelete={canDelete ? () => deleteDoc(doc(db, "team", pilot.id)) : undefined}
                  onAddUnavailability={(window, conflictingEventIds) =>
                    addUnavailability(pilot, window, conflictingEventIds)
                  }
                  onRemoveUnavailability={(windowId) => removeUnavailability(pilot, windowId)}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-4">
        <p className="text-sm font-semibold text-ink-soft">Přidat pilota do týmu</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Jméno"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="E-mail (gmail)"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefon"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Adresa"
            className="rounded-lg border border-line bg-bg px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button
          onClick={addPilot}
          disabled={adding}
          className="self-start rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Přidat pilota
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { Drone, RescueEvent, TeamMember } from "../../lib/types";
import { DroneCard } from "../../components/DroneCard";

export function DronesPage() {
  const { data: drones, loading } = useCollection<Drone>("drones");
  const { data: events } = useCollection<RescueEvent>("events", [orderBy("startTime", "asc")]);
  const { data: pilots } = useCollection<TeamMember>("team");
  const [newName, setNewName] = useState("");
  const [newRegistration, setNewRegistration] = useState("");
  const [adding, setAdding] = useState(false);

  const now = Date.now();

  async function addDrone() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "drones"), {
        name: newName.trim(),
        registrationNumber: newRegistration.trim(),
        currentHolder: "",
        note: "",
      });
      setNewName("");
      setNewRegistration("");
    } finally {
      setAdding(false);
    }
  }

  async function saveDrone(
    droneId: string,
    data: { registrationNumber: string; currentHolder: string; note: string },
  ) {
    await updateDoc(doc(db, "drones", droneId), data);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Drony</h1>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {drones.map((drone) => (
            <DroneCard
              key={drone.id}
              drone={drone}
              pilots={pilots}
              upcoming={events.filter(
                (e) =>
                  e.droneId === drone.id &&
                  e.status !== "done" &&
                  new Date(e.startTime).getTime() >= now - 1000 * 60 * 60 * 6,
              )}
              onSave={(data) => saveDrone(drone.id, data)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-line p-4 sm:flex-row sm:items-center">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Přidat další dron (např. Dron 3)"
          className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
        />
        <input
          value={newRegistration}
          onChange={(e) => setNewRegistration(e.target.value)}
          placeholder="Registrační číslo"
          className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm font-mono-nums"
        />
        <button
          onClick={addDrone}
          disabled={adding || !newName.trim()}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
        >
          Přidat
        </button>
      </div>
    </div>
  );
}

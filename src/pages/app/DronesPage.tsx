import { useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { Drone, RescueEvent } from "../../lib/types";
import { DroneCard } from "../../components/DroneCard";

export function DronesPage() {
  const { data: drones, loading } = useCollection<Drone>("drones");
  const { data: events } = useCollection<RescueEvent>("events", [orderBy("startTime", "asc")]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const now = Date.now();

  async function addDrone() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "drones"), {
        name: newName.trim(),
        currentHolder: "",
        note: "",
      });
      setNewName("");
    } finally {
      setAdding(false);
    }
  }

  async function saveHolder(droneId: string, holder: string, note: string) {
    await updateDoc(doc(db, "drones", droneId), { currentHolder: holder, note });
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
              upcoming={events.filter(
                (e) =>
                  e.droneId === drone.id &&
                  e.status !== "done" &&
                  new Date(e.startTime).getTime() >= now - 1000 * 60 * 60 * 6,
              )}
              onSaveHolder={(holder, note) => saveHolder(drone.id, holder, note)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-line p-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Přidat další dron (např. Dron 3)"
          className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm"
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

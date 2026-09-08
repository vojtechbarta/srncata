import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, addDoc, updateDoc, deleteDoc, getDoc, collection } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { useCollection } from "../../lib/useCollection";
import type { Drone, NewRescueEvent, RescueEvent, StoredEventFieldItem, TeamMember } from "../../lib/types";
import { fromStoredEventFields, toStoredEventFields } from "../../lib/types";
import { EventForm } from "../../components/EventForm";

export function EventDetailPage() {
  const { id } = useParams();
  const isNew = id === "nova";
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: drones } = useCollection<Drone>("drones");
  const { data: team } = useCollection<TeamMember>("team");
  const { data: events } = useCollection<RescueEvent>("events");

  const [event, setEvent] = useState<RescueEvent | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    getDoc(doc(db, "events", id)).then((snap) => {
      if (snap.exists()) {
        const raw = snap.data() as Omit<RescueEvent, "id" | "fields"> & {
          fields?: StoredEventFieldItem[];
        };
        setEvent({ id: snap.id, ...raw, fields: fromStoredEventFields(raw.fields) });
      }
      setLoading(false);
    });
  }, [id, isNew]);

  async function handleSave(data: NewRescueEvent) {
    setSaving(true);
    const now = new Date().toISOString();
    // Firestore nedovolí pole vnořené přímo v poli (viz EventFieldItem.polygon
    // v src/lib/types.ts) — před zápisem každou akci projedeme konverzí.
    const payload = { ...data, fields: toStoredEventFields(data.fields) };
    try {
      if (isNew) {
        await addDoc(collection(db, "events"), {
          ...payload,
          createdBy: user?.email ?? "",
          createdAt: now,
          updatedAt: now,
        });
      } else if (id) {
        await updateDoc(doc(db, "events", id), { ...payload, updatedAt: now });
      }
      navigate("/app/akce");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    await deleteDoc(doc(db, "events", id));
    navigate("/app/akce");
  }

  if (loading) return <p className="text-ink-soft">Načítání…</p>;
  if (!isNew && !event) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-soft">Akce nenalezena.</p>
        <Link to="/app/akce" className="text-brand underline underline-offset-2">
          Zpět na seznam akcí
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/app/akce" className="text-sm font-semibold text-ink-soft hover:text-ink">
          ← Akce
        </Link>
      </div>
      <h1 className="font-display text-2xl font-bold">
        {isNew ? "Nová akce" : event?.locationName || "Detail akce"}
      </h1>
      <EventForm
        initial={event ?? undefined}
        drones={drones}
        team={team}
        events={events}
        onSave={handleSave}
        onDelete={isNew ? undefined : handleDelete}
        onCancel={() => navigate("/app/akce")}
        saving={saving}
      />
    </div>
  );
}

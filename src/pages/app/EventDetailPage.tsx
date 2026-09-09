import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { doc, addDoc, updateDoc, deleteDoc, getDoc, collection } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { useCollection } from "../../lib/useCollection";
import type {
  Drone,
  HuntingGround,
  NewRescueEvent,
  RescueEvent,
  StoredEventFieldItem,
  TeamMember,
} from "../../lib/types";
import { fromStoredEventFields, toStoredEventFields } from "../../lib/types";
import { EventForm } from "../../components/EventForm";

/** Připraví načtenou akci jako předlohu pro "Kopírovat akci" — všechno
 * kromě statistik (ty se týkají proběhlé konkrétní akce, ne šablony
 * pro novou). Stav se resetuje na koncept a odsouhlasení kolizí
 * pilota/dronu se resetuje, ať je uživatel musí u nové akce (klidně na
 * stejné datum jako originál) posoudit znovu. `id` je záměrně prázdné
 * — necháváme EventForm/handleSave zacházet s tím jako s novou akcí,
 * ne úpravou originálu. */
function buildCopyTemplate(source: RescueEvent): RescueEvent {
  return {
    ...source,
    id: "",
    status: "draft",
    fields: [...source.fields],
    caughtCount: null,
    chasedCount: null,
    deadCount: null,
    hunterPresent: false,
    actualAreaHa: null,
    postNote: "",
    pilotConflictAck: false,
    droneConflictAck: false,
  };
}

export function EventDetailPage() {
  const { id } = useParams();
  const isNew = id === "nova";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const copyFromId = isNew ? searchParams.get("copyFrom") : null;

  const { data: drones } = useCollection<Drone>("drones");
  const { data: team } = useCollection<TeamMember>("team");
  const { data: events } = useCollection<RescueEvent>("events");
  const { data: huntingGrounds } = useCollection<HuntingGround>("huntingGrounds");

  const [event, setEvent] = useState<RescueEvent | null>(null);
  const [copyTemplate, setCopyTemplate] = useState<RescueEvent | null>(null);
  const [loading, setLoading] = useState(!isNew || !!copyFromId);
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

  useEffect(() => {
    if (!isNew || !copyFromId) return;
    getDoc(doc(db, "events", copyFromId)).then((snap) => {
      if (snap.exists()) {
        const raw = snap.data() as Omit<RescueEvent, "id" | "fields"> & {
          fields?: StoredEventFieldItem[];
        };
        setCopyTemplate(buildCopyTemplate({ id: snap.id, ...raw, fields: fromStoredEventFields(raw.fields) }));
      }
      setLoading(false);
    });
  }, [isNew, copyFromId]);

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
      <div className="flex items-center justify-between gap-3">
        <Link to="/app/akce" className="text-sm font-semibold text-ink-soft hover:text-ink">
          ← Akce
        </Link>
        {!isNew && event && (
          <div className="flex items-center gap-4">
            <Link
              to={`/app/akce/nova?copyFrom=${event.id}`}
              className="text-sm font-semibold text-brand hover:underline"
            >
              📋 Kopírovat akci
            </Link>
            <Link
              to={`/app/akce/${event.id}/tisk`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-brand hover:underline"
            >
              🖨️ Tisk / PDF
            </Link>
          </div>
        )}
      </div>
      <h1 className="font-display text-2xl font-bold">
        {isNew ? "Nová akce" : event?.locationName || "Detail akce"}
      </h1>
      <EventForm
        initial={(isNew ? copyTemplate : event) ?? undefined}
        drones={drones}
        team={team}
        events={events}
        huntingGrounds={huntingGrounds}
        onSave={handleSave}
        onDelete={isNew ? undefined : handleDelete}
        onCancel={() => navigate("/app/akce")}
        saving={saving}
      />
    </div>
  );
}

// Doménové typy appky pro plánování akcí (letů) a správu dronů.

export type EventStatus = "draft" | "confirmed" | "done";

export const EVENT_STATUSES: EventStatus[] = ["draft", "confirmed", "done"];

export const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Koncept",
  confirmed: "Potvrzeno",
  done: "Odlétáno",
};

/** Jedna akce (výjezd na pole s dronem). */
export interface RescueEvent {
  id: string;
  status: EventStatus;

  pilot: string;
  droneId: string | null;

  coordinatorPhone: string;
  hunterContact: string;
  otherContact: string;

  startTime: string; // ISO datetime string
  locationName: string;
  mapsLink: string;

  caughtCount: number | null; // ochyceno srnčat
  chasedCount: number | null; // vyhnáno srnčat

  note: string;
  photosLink: string;

  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type NewRescueEvent = Omit<RescueEvent, "id" | "createdAt" | "updatedAt" | "createdBy">;

/** Jeden dron ve výbavě spolku. */
export interface Drone {
  id: string;
  name: string;
  currentHolder: string; // kdo ho má aktuálně u sebe
  note: string;
}

/** Člen týmu (pilot/koordinátor) — zdroj pro výběr pilota a pro whitelist přihlášení. */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

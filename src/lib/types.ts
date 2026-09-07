// Doménové typy appky pro plánování akcí (letů) a správu dronů.

export type EventStatus = "draft" | "confirmed" | "done" | "cancelled";

export const EVENT_STATUSES: EventStatus[] = ["draft", "confirmed", "done", "cancelled"];

export const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Koncept",
  confirmed: "Potvrzeno",
  done: "Odlétáno",
  cancelled: "Zrušeno",
};

/** Smazat jde jen akci, která se buď ještě nedomluvila, nebo se nakonec nekoná. */
export const DELETABLE_STATUSES: EventStatus[] = ["draft", "cancelled"];

export const CROP_TYPES = ["Jetel", "Vojtěška", "Traviny", "Jílek"] as const;
export type CropType = (typeof CROP_TYPES)[number];

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
  areaHa: number | null; // rozloha pole v hektarech
  cropType: CropType | ""; // typ porostu (Jetel/Vojtěška/Traviny/Jílek)

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
  registrationNumber: string; // registrační číslo (evidence UAV/dronů)
  currentHolder: string; // kdo ho má aktuálně u sebe
  note: string;
}

/**
 * Člen týmu (pilot/koordinátor) — zdroj pro výběr pilota u akce a pro
 * whitelist přihlášení (viz `firestore.rules`). `id` dokumentu == `email`,
 * takže změna e-mailu u existujícího pilota se řeší jako smazání starého
 * a založení nového dokumentu (viz `PilotsPage`).
 */
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type NewTeamMember = Omit<TeamMember, "id">;

export type PostStatus = "draft" | "published";

/**
 * Jeden příspěvek na veřejném blogu. `id` dokumentu == `slug` (viz
 * `src/lib/slug.ts`), takže se stává součástí URL (`/blog/:slug`) a po
 * založení příspěvku se dál needituje.
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // prostý text, odstavce oddělené prázdným řádkem
  author: string;
  status: PostStatus;
  publishedAt: string; // ISO datum, i pro koncepty (kdy má vyjít)
  createdAt: string;
  updatedAt: string;
}

export type NewBlogPost = Omit<BlogPost, "id" | "createdAt" | "updatedAt">;

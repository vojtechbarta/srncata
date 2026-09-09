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

/**
 * Jedno pole/bod v rámci akce — buď dohledané podle čísla půdního bloku
 * (LPIS), nebo zadané rovnou jako bod na mapě (např. z Google Maps
 * odkazu, když zemědělec pošle jen souřadnice a číslo bloku neznáme).
 * Pořadí v poli `fields` u akce odpovídá pořadí sečení. Uchováváme si i
 * skutečnou hranici bloku (když ji známe), ať jde zobrazit na mapě znovu
 * i později bez opětovného dotazu na LPIS — viz `src/lib/lpis.ts`.
 */
export interface EventFieldItem {
  id: string; // klientský identifikátor (pro řazení/mazání v UI)
  label: string; // vlastní popisek, např. "Horní louka" nebo jméno zemědělce
  time: string; // odhad času sečení téhle části, "HH:mm" (nepovinné)
  lpisCode: string; // kodCtverec, pokud dohledané přes LPIS (jinak prázdné — jen bod)
  owner: string; // zemědělec/farma z LPIS (uzivatel), pokud dohledané
  ownerAddress: string; // adresa zemědělce z LPIS (adresaUzivatele) — telefon LPIS veřejně nedává
  areaHa: number | null;
  lat: number;
  lng: number;
  polygon: { lat: number; lng: number }[][]; // vnější obrysy bloku (prázdné, když jen bod bez LPIS)
}

/** Jedna akce (výjezd na pole s dronem). */
export interface RescueEvent {
  id: string;
  status: EventStatus;

  pilot: string;
  // Odkaz na tým (doc ID = e-mail) — dohledaný podle jména v okamžiku
  // uložení. Díky tomu přejmenování pilota v týmu zpětně nerozbije
  // párování u už uložených akcí (na rozdíl od `pilot`, což zůstává jen
  // zobrazované jméno a podporuje i hostujícího pilota mimo tým). Null,
  // když zadané jméno neodpovídá žádnému aktuálnímu členu týmu.
  pilotId: string | null;
  droneId: string | null;

  coordinatorPhone: string;
  hunterContact: string;
  otherContact: string;
  hunterExpected: boolean; // plánováno — myslivec bude na akci přítomen

  startTime: string; // ISO datetime string
  locationName: string;
  mapsLink: string;
  areaHa: number | null; // rozloha pole v hektarech
  cropType: CropType | ""; // typ porostu (Jetel/Vojtěška/Traviny/Jílek)
  fields: EventFieldItem[]; // pole/body v pořadí sečení (může být prázdné)

  caughtCount: number | null; // ochyceno srnčat
  chasedCount: number | null; // vyhnáno srnčat
  deadCount: number | null; // nalezeno mrtvých srnčat (nezdařený zásah)
  hunterPresent: boolean; // skutečnost — myslivec byl na akci osobně přítomen
  actualAreaHa: number | null; // skutečně posečená/prolétaná plocha — na rozdíl od odhadu v areaHa
  postNote: string; // poznámka po akci (jak to dopadlo) — na rozdíl od note, což je poznámka z plánování

  // "Beru na vědomí, že pilot/dron má víc akcí tento den" — jednou
  // odsouhlasené se ukládá, ať se při každém dalším otevření (třeba jen
  // kvůli přidání pole) nemusí potvrzovat znovu. Reset na false, jakmile
  // se pilot/dron/datum ve formuláři změní (viz EventForm).
  pilotConflictAck?: boolean;
  droneConflictAck?: boolean;

  note: string;
  photosLink: string;

  createdBy: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type NewRescueEvent = Omit<RescueEvent, "id" | "createdAt" | "updatedAt" | "createdBy">;

/**
 * Firestore nepodporuje pole vnořené přímo v poli ("nested arrays") —
 * `EventFieldItem.polygon` (pole obrysů, každý obrys pole bodů) proto
 * při zápisu/čtení zabalíme každý obrys do mezi-objektu `{ points }`.
 * V appce se všude pracuje s běžným `EventFieldItem` (viz EventForm,
 * EventFieldsEditor) — tahle konverze se dělá jen na hranici s Firestore
 * (viz EventDetailPage).
 */
export interface StoredEventFieldItem extends Omit<EventFieldItem, "polygon"> {
  polygon: { points: { lat: number; lng: number }[] }[];
}

export function toStoredEventFields(fields: EventFieldItem[]): StoredEventFieldItem[] {
  return fields.map((f) => ({ ...f, polygon: f.polygon.map((points) => ({ points })) }));
}

export function fromStoredEventFields(stored: StoredEventFieldItem[] | undefined): EventFieldItem[] {
  if (!stored) return [];
  return stored.map((f) => ({ ...f, polygon: f.polygon.map((ring) => ring.points) }));
}

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
/** Období, kdy pilot není k dispozici (dovolená, práce, …) — "od" a "do"
 * jsou kalendářní data "YYYY-MM-DD" (bez času), oba dny včetně. */
export interface UnavailabilityWindow {
  id: string;
  from: string;
  to: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  /** Volitelné — starší dokumenty v databázi ho nemusí mít, viz `?? []` v místech čtení. */
  unavailability?: UnavailabilityWindow[];
}

export type NewTeamMember = Omit<TeamMember, "id">;

/**
 * Honitba — evidence pro rychlé dohledání kontaktu na hospodáře, až se
 * bude řešit konkrétní akce na jejím území. Kontakt na hospodáře se nikde
 * veřejně nedá dohledat automaticky (ověřeno u ČÚZK/NLI vrstvy honiteb),
 * takže se zadává ručně; jméno honitby jde občas dohledat na portálech
 * typu nasemapy.cz, ale ty nemají stabilní odkaz na konkrétní honitbu,
 * proto je i mapLink jen volitelný ruční odkaz.
 */
// Okresní myslivecké spolky v Moravskoslezském kraji — jediná oblast,
// kde tým aktuálně honitby eviduje.
export const OMS_OPTIONS = [
  "Bruntál",
  "Frýdek-Místek",
  "Karviná",
  "Nový Jičín",
  "Opava",
  "Ostrava",
] as const;

export type Oms = (typeof OMS_OPTIONS)[number];

export interface HuntingGround {
  id: string;
  name: string;
  oms: Oms | ""; // okresní myslivecký spolek — nepovinné
  mapLink: string;
  wardenName: string; // jméno mysliveckého hospodáře
  wardenPhone: string; // telefon na hospodáře
  note: string;
}

export type NewHuntingGround = Omit<HuntingGround, "id">;

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

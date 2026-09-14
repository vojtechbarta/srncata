// Jednorázový import zaznamenaných akcí sezóny 2026 z Google Sheets
// (list "zakázky" v Tabulce záchranných akcí 2026, export uložený v
// scripts/data/season-2026-zakazky.csv) do Firestore. Sezóna je uzavřená,
// všechny importované akce mají status "done" (Odlétáno) a typ "fawn"
// (Záchrana srnčat).
//
// Sešit nemá spoustu údajů, co appka dnes eviduje (čas akce, konkrétní
// dron, honitba, LPIS pole) — rozhodnutí, jak s tím naložit, viz komentáře
// u jednotlivých polí níže a shrnutí v README importu (dole v souboru).
//
// Použití:
//   node scripts/import-season-2026.mjs --dry-run     # jen vypíše, nic nezapisuje
//   node scripts/import-season-2026.mjs --apply       # skutečně zapíše do Firestore
//
// Proti emulátoru (nejdřív `npm run emulators` v jiném terminálu):
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/import-season-2026.mjs --apply
//
// Proti produkci: až po `npm run backup`, potřebuje service-account.json.
//
// Idempotentní — ID dokumentu je deterministické (`season2026-<řádek>`),
// opakované spuštění existující záznamy jen přepíše (stejná data), nikdy
// je nezdvojí. Každý zapsaný dokument má navíc `importedFrom:
// "sheets-season-2026"` (appka to pole nezobrazuje, jen pro dohledání).
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const CSV_PATH = new URL("./data/season-2026-zakazky.csv", import.meta.url);
const DEFAULT_TIME = "05:00"; // sešit nemá hodinu — 05:00 = orientační čas svítání, kdy appka typicky lítá
const IMPORT_MARKER = "sheets-season-2026";
const IMPORTED_BY = "bartavoj@gmail.com";
const DEFAULT_DRONE_NAME = "Dron 1"; // sešit rozlišuje jen ano/ne, ne konkrétní dron

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
if (!APPLY && !args.has("--dry-run")) {
  console.error("Zadej --dry-run (jen náhled) nebo --apply (skutečně zapsat).");
  process.exit(1);
}

/** Minimální CSV parser (stačí na tenhle export — bez polí s víceřádkovým textem). */
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (line === "") continue;
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQuotes = false;
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}

/** "st 13. 5 2026" / "st 20.5.2026" / "pá 22. 5 2026" -> "2026-05-13" */
function parseSheetDate(raw) {
  const m = raw.match(/(\d{1,2})\.\s*(\d{1,2})[.\s]+(\d{4})/);
  if (!m) throw new Error(`Nerozpoznané datum: "${raw}"`);
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/** "25" / "3,5" -> 25 / 3.5; prázdné -> null */
function parseNumber(raw) {
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const CROP_MAP = { jetel: "Jetel", louka: "Traviny" };

/** "ano"/"byli přítomní..." -> true, "ne"/"nebyli přítomni" -> false, jinak nejde říct jistě -> null */
function parseHunterPresent(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s === "ano" || s.startsWith("byli přítomní") || s.startsWith("byl přítomný") || s.startsWith("ano ")) {
    return true;
  }
  if (s === "ne" || s.startsWith("nebyli přítomni")) return false;
  return null; // "netuším :/" apod. — nejde říct jistě, text jde do poznámky
}

/** Normalizace pro fuzzy shodu jména pilota — bez diakritiky, malá písmena, ořezané. */
function normalizeName(s) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

async function main() {
  const csvText = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csvText);
  const header = rows[2];
  const dataRows = rows.slice(3).filter((r) => r[0]?.trim());
  console.log(`Načteno ${dataRows.length} řádků (hlavička: ${header.join(" | ")})`);

  const serviceAccount = process.env.FIRESTORE_EMULATOR_HOST
    ? null
    : JSON.parse(readFileSync(new URL("../service-account.json", import.meta.url)));
  initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : {});
  const db = getFirestore();

  const [teamSnap, droneSnap] = await Promise.all([db.collection("team").get(), db.collection("drones").get()]);
  const team = teamSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const defaultDrone = droneSnap.docs.map((d) => ({ id: d.id, ...d.data() })).find((d) => d.name === DEFAULT_DRONE_NAME);
  if (APPLY && !defaultDrone) {
    console.error(`Dron "${DEFAULT_DRONE_NAME}" v databázi nenalezen — zkontroluj název.`);
    process.exit(1);
  }

  function nameTokens(s) {
    return normalizeName(s).split(/\s+/).filter(Boolean);
  }

  // Přesná shoda, nebo když jsou všechna slova kratšího jména obsažená
  // v delším (typicky přejmenování — přibylo prostřední/rodné jméno,
  // např. "Markéta Káňová" -> "Markéta Cycoňová Káňová"). Shoda musí být
  // jednoznačná (právě jeden člen týmu), jinak radši nic.
  function matchPilotId(rawName) {
    const target = nameTokens(rawName);
    const candidates = team.filter((m) => {
      const teamTokens = nameTokens(m.name);
      const [shorter, longer] = target.length <= teamTokens.length ? [target, teamTokens] : [teamTokens, target];
      return shorter.length > 0 && shorter.every((tok) => longer.includes(tok));
    });
    return candidates.length === 1 ? candidates[0].id : null;
  }

  const batch = db.batch();
  const preview = [];

  dataRows.forEach((row, i) => {
    const [
      datum,
      lokalita,
      vymeraPredpoklad,
      jetel,
      , // MS — prázdné u všech řádků této sezóny
      , // MS kontakt — prázdné u všech řádků
      , // MS tel. — prázdné u všech řádků
      pilotRaw,
      dron,
      poznamka,
      myslivci,
      dobrovolnici,
      , // stav — appka ho ignoruje, celý import je "done"
      podKosem,
      vyhnano,
      ostatni,
      odmena,
      skutecnaVymera,
    ] = row;

    const pilot = pilotRaw.trim();
    const hunterPresent = parseHunterPresent(myslivci);

    // Vše, co appka dnes nemá jako vlastní pole, ale nechceme to ztratit —
    // slepené do poznámky po akci (viz rozhodnutí s uživatelem).
    const extraNotes = [];
    if (poznamka.trim()) extraNotes.push(poznamka.trim());
    if (ostatni.trim()) extraNotes.push(`Ostatní zvěř/nálezy: ${ostatni.trim()}`);
    if (hunterPresent === null && myslivci.trim()) extraNotes.push(`Myslivci: ${myslivci.trim()}`);
    if (dobrovolnici.trim()) extraNotes.push(`Dobrovolníci: ${dobrovolnici.trim()}`);
    if (odmena.trim()) extraNotes.push(`Odměna: ${odmena.trim()}`);

    const event = {
      status: "done",
      kind: "fawn",

      pilot,
      pilotId: pilot.includes(" a ") || pilot.includes(" + ") ? null : matchPilotId(pilot),
      droneId: dron.trim().toLowerCase() === "ano" ? (defaultDrone?.id ?? null) : null,

      coordinatorPhone: "",
      schoolName: "",
      hunterContact: "",
      otherContact: "",
      huntingGroundId: null,
      volunteerCount: null,
      hasNewcomers: false,
      hunterExpected: false,

      startTime: `${parseSheetDate(datum)}T${DEFAULT_TIME}`,
      locationName: lokalita.trim(),
      mapsLink: "",
      areaHa: parseNumber(vymeraPredpoklad),
      cropType: CROP_MAP[jetel.trim().toLowerCase()] ?? "",
      fields: [],

      caughtCount: parseNumber(podKosem),
      chasedCount: parseNumber(vyhnano),
      deadCount: null,
      hunterPresent: hunterPresent === true,
      actualAreaHa: parseNumber(skutecnaVymera),
      postNote: extraNotes.join("\n\n"),

      note: "",
      photosLink: "",
      photos: [],
      coverPhotoId: null,

      createdBy: IMPORTED_BY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      importedFrom: IMPORT_MARKER,
    };

    const id = `season2026-${String(i + 1).padStart(2, "0")}`;
    preview.push({ id, ...event });
    if (APPLY) batch.set(db.collection("events").doc(id), event);
  });

  console.log("\n--- Náhled prvních 3 a poslední akce ---");
  for (const e of [...preview.slice(0, 3), preview[preview.length - 1]]) {
    console.log(JSON.stringify(e, null, 2));
  }

  const unmatchedPilots = [...new Set(preview.filter((e) => !e.pilotId).map((e) => e.pilot))];
  console.log(`\nCelkem akcí: ${preview.length}`);
  console.log(`Piloti BEZ napojení na tým (pilotId null): ${unmatchedPilots.join(", ")}`);
  console.log(`Bez dronu (droneId null): ${preview.filter((e) => !e.droneId).length}`);
  console.log(`Bez typu porostu (cropType ""): ${preview.filter((e) => e.cropType === "").length}`);
  console.log(`Bez odhadu rozlohy (areaHa null): ${preview.filter((e) => e.areaHa === null).length}`);
  console.log(`hunterPresent=true: ${preview.filter((e) => e.hunterPresent).length} / ${preview.length}`);

  if (APPLY) {
    await batch.commit();
    console.log(`\nZapsáno ${preview.length} akcí do Firestore (${serviceAccount ? "PRODUKCE" : "emulátor"}).`);
  } else {
    console.log("\n(--dry-run — nic se nezapsalo)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

# Záchrana srnčat — appka pro piloty

Web spolku + interní appka pro plánování letů s termovizním dronem při senosečích.

- **Veřejná část** (`/`, `/tym`, `/kontakt`) — o nás, kontakt, nahlášení pole. Nahrazuje
  dosavadní web na Webflow.
- **Neveřejná část** (`/app`) — jen pro tým, přihlášení Google účtem:
  - **Akce** — seznam plánovaných/proběhlých letů se stavy Koncept → Potvrzeno → Odlétáno.
  - **Drony** — kdo má aktuálně který dron u sebe a jaké má nadcházející rezervace.

## Technologie

React + TypeScript + Vite, Tailwind CSS 4, Firebase (Auth přes Google, Firestore jako
databáze, Hosting). Žádný vlastní backend — appka mluví s Firestore přímo z prohlížeče,
přístup hlídají Firestore security rules (`firestore.rules`).

## Lokální vývoj

Vyvíjí a testuje se proti **Firebase Local Emulator Suite** — nic se neposílá do
skutečného cloudu, není potřeba mít založený Firebase projekt.

Emulátory běží na Javě — pokud `npm run emulators` spadne na hlášce o chybějícím Java
Runtime, doinstaluj ho (macOS: `brew install openjdk` a pak podle instrukcí z výstupu
přidat ho do PATH, případně `brew install --cask temurin`).

```bash
npm install

# terminál 1 — emulátory Auth + Firestore + jejich UI na http://127.0.0.1:4000
npm run emulators

# terminál 2 — jednorázově naplní emulátor ukázkovým týmem/drony/akcemi
npm run seed

# terminál 3 — appka na http://localhost:5173
npm run dev
```

`.env` už je připravený s `VITE_USE_EMULATORS=true`, appka se sama napojí na
emulátory (viz `src/lib/firebase.ts`).

### Přihlášení v emulátoru

Auth emulátor nedělá skutečné Google přihlášení — otevře vlastní okno, kam zadáš
libovolný e-mail a jméno "jako by" to bylo Google. Aby tě appka pustila do `/app`, musí
ten e-mail existovat jako dokument v kolekci `team` (to `npm run seed` založí pro
`bartavoj@gmail.com`). Stav dat po naplnění jde prohlížet v Emulator UI
(http://127.0.0.1:4000/firestore).

## Datový model (Firestore)

- `team/{email}` — `{ name, email }`. E-mail je zároveň ID dokumentu a řídí, kdo se
  vůbec dostane do neveřejné části (viz `firestore.rules`). Ostatně řízení přístupu je
  vůči malému důvěryhodnému týmu záměrně jednoduché — kdo je v `team`, ten smí číst a
  psát všechno.
- `drones/{id}` — `{ name, currentHolder, note }`.
- `events/{id}` — jedna akce/let: `status` (`draft`/`confirmed`/`done`), `pilot`,
  `droneId`, `coordinatorPhone`, `hunterContact`, `otherContact`, `startTime` (ISO),
  `locationName`, `mapsLink`, `caughtCount`, `chasedCount`, `note`, `photosLink`,
  `createdBy`, `createdAt`, `updatedAt`. Přesné typy viz `src/lib/types.ts`.

## Nasazení na ostrou verzi

Až budete chtít appku pustit na `piloti.zachransrncemsk.cz` (nebo jinou subdoménu):

1. Založit Firebase projekt na https://console.firebase.google.com (stačí Google účet
   spolku), v něm zapnout **Authentication → Sign-in method → Google** a založit
   **Firestore Database** (produkční režim).
2. V Project settings → Your apps přidat webovou appku a zkopírovat konfiguraci do
   `.env` (podle `.env.example`), nastavit `VITE_USE_EMULATORS=false`.
3. V `.firebaserc` nahradit `demo-srncata` skutečným Project ID.
4. `firebase login`, pak `npm run deploy` (postaví appku a nahraje ji + pravidla).
5. V Firebase Hosting přidat vlastní doménu `piloti.zachransrncemsk.cz` — Firebase dá
   DNS záznamy (TXT pro ověření + A/CNAME), ty se přidají u správce DNS domény
   `zachransrncemsk.cz`.
6. Do kolekce `team` (přes Firestore Console) přidat e-maily všech pilotů — bez toho se
   nikdo (kromě dat z `seed` skriptu) do `/app` nedostane.

## Co zatím chybí / plánované rozšíření

- **Fotky z akcí** — teď je jen textové políčko na odkaz (např. na Google Disk). Nahrávání
  fotek přímo v appce (uložené třeba do Firebase Storage) je připravené jako další krok,
  zatím záměrně vynechané.
- **Statistiky** (počty zachráněných srnčat v čase, podle pilota/oblasti) — až budou
  data z reálného provozu.
- **Veřejné stránky** `/tym` a `/kontakt` mají zatím jen placeholder texty pro
  jména/foto členů týmu — doplňte je v `src/pages/public/TeamPage.tsx`.

# Zachraň srnče Moravskoslezský kraj — appka pro piloty

Web spolku + interní appka pro plánování letů s termovizním dronem při senosečích.

**Živě na https://zachransrncemsk.cz** (a na `piloti.zachransrncemsk.cz`, což je
zkratka na stejnou appku).

- **Veřejná část** (`/`, `/tym`, `/blog`, `/kontakt`) — o nás, tým, blog, kontakt.
  Nahradila dosavadní web postavený ve Webglobe WebEditoru.
- **Neveřejná část** (`/app`) — jen pro tým, přihlášení Google účtem:
  - **Akce** — seznam plánovaných/proběhlých letů se stavy Koncept → Potvrzeno → Odlétáno.
  - **Piloti** — kontakty na tým (jméno, telefon, adresa) + řídí, kdo se může přihlásit.
  - **Drony** — kdo má aktuálně který dron u sebe a jaké má nadcházející rezervace.
  - **Blog** (`/app/blog`) — psaní/úprava příspěvků na veřejný blog.

## Technologie

React + TypeScript + Vite, Tailwind CSS 4, Firebase (Auth přes Google, Firestore jako
databáze, Hosting). Žádný vlastní backend — appka mluví s Firestore přímo z prohlížeče,
přístup hlídají Firestore security rules (`firestore.rules`).

Produkční Firebase projekt: **`zachran-srnce-msk`**, Firestore v regionu `europe-west3`
(Frankfurt — kvůli GDPR u osobních údajů pilotů).

## Lokální vývoj

Vyvíjí a testuje se proti **Firebase Local Emulator Suite** — nic se neposílá do
skutečného cloudu.

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

`.env` je nastavený s `VITE_USE_EMULATORS=true`, appka se sama napojí na emulátory
(viz `src/lib/firebase.ts`) — zbylé `VITE_FIREBASE_*` hodnoty v `.env` jsou reálné
(z produkčního projektu), ale dokud je `VITE_USE_EMULATORS=true`, nepoužijí se.

### Přihlášení v emulátoru

Auth emulátor nedělá skutečné Google přihlášení — otevře vlastní okno, kam zadáš
libovolný e-mail a jméno "jako by" to bylo Google. Aby tě appka pustila do `/app`, musí
ten e-mail existovat jako dokument v kolekci `team` (to `npm run seed` založí pro
`bartavoj@gmail.com`). Stav dat po naplnění jde prohlížet v Emulator UI
(http://127.0.0.1:4000/firestore).

## Testy

```bash
npm test          # jednorázově spustí všechny testy
npm run test:watch  # sleduje změny a spouští testy znovu
npm run test:rules   # testy firestore.rules — potřebuje Firebase CLI, spustí si svůj emulátor
npm run test:e2e     # end-to-end testy v prohlížeči (Playwright) — taky přes emulátor
```

Vitest, žádné Firebase — pokrývají jen čistou (bezstavovou) logiku v `src/lib/`,
kde chyba nejsnáz proklouzne potichu a projeví se až v terénu: parsování Google Maps
odkazů (`maps.ts`), dohledávání půdních bloků přes LPIS včetně point-in-polygon a
třídění podle vzdálenosti (`lpis.ts`, síť mockovaná přes `fetch`), a generování
exportů pro piloty — GPX a KMZ pro DJI Pilot 2 (`gpx.ts`, `djiWpml.ts`).

`npm run test:rules` je samostatný od zbytku (viz `firestore.rules.test.ts` a
`vitest.rules.config.ts`) — pokrývá každé `match` v `firestore.rules` přes
`@firebase/rules-unit-testing` (`firebase emulators:exec` mu spustí a zase ukončí
vlastní dočasný Firestore emulátor, nezasahuje do dat z `npm run emulators`/
`npm run seed`). Na rozdíl od ostatních testů se do `npm test` záměrně nepřimíchá —
bez běžícího emulátoru by jen spadl na chybě připojení.

`npm run test:e2e` (viz `e2e/`, `playwright.config.ts`) proklikává appku ve
skutečném (headless) Chromiu proti `npm run dev` + Firestore/Auth emulátorům —
`firebase emulators:exec` zajistí emulátory, `playwright.config.ts` k tomu navíc
nastartuje dev server a před prvním testem zavolá `e2e/global-setup.ts`, co
emulátor naplní daty. Pokrývá veřejné stránky i přihlášenou appku (přihlášení,
mobilní menu, blokaci smazání pilota s vybavením, validaci exportu do DJI Pilot 2,
validaci e-mailu, kolizi slugu na blogu) — vzniklo jako pokračování bezpečnostní
kontroly appky, ať se stejné chyby nevrátí. Přihlašování v testech jde přes
`login-harness.html` (`signInWithCustomToken`, viz komentář v tom souboru) —
klikání přes skutečné Google popup okno Auth emulátoru je na automatizaci
nespolehlivé (interní "iframe relay" handshake bývá pomalejší než emulátor+
headless Chromium stihnou), pokrývá ho jen jeden smoke test samotného tlačítka
(`e2e/auth.spec.ts`). Komponenty appky žádné jiné (unit) testy nemají — appka je
malá a používala ji jen pár lidí z týmu, tohle je první krok k automatizovanému
pokrytí i UI vrstvy.

## Datový model (Firestore)

- `team/{email}` — `{ name, email, phone, address }`. E-mail je zároveň ID dokumentu
  a řídí, kdo se vůbec dostane do neveřejné části (viz `firestore.rules`). Řízení
  přístupu je vůči malému důvěryhodnému týmu záměrně jednoduché — kdo je v `team`,
  ten smí číst a psát skoro všechno (kromě psaní příspěvků na blogu, což hlídá
  stejná podmínka). Jediná výjimka je kompletní smazání cizího záznamu z `team` —
  to smí jen admin (`bartavoj@gmail.com`, viz `isAdmin()`), nebo pilot sám za sebe.
- `drones/{id}` — `{ name, registrationNumber, currentHolder, note }`.
- `equipment/{id}` — ostatní vybavení (nabíjecí stanice, Kesr, vysílačky, přepravky):
  `{ category, name, sortIndex, holderId, note }`. `category` je uzavřený výčet
  (`EquipmentCategory` v `src/lib/types.ts`), `holderId` odkazuje na `team/{email}`.
  Přepravky mají unikátní čísla 1–20 (`sortIndex`) a doc ID `crate-{n}`.
- `events/{id}` — jedna akce/let: `status` (`draft`/`confirmed`/`done`), `pilot`,
  `droneId`, `coordinatorPhone`, `hunterContact`, `otherContact`, `startTime` (ISO),
  `locationName`, `mapsLink`, `areaHa`, `cropType`, `caughtCount`, `chasedCount`, `note`,
  `photosLink`, `createdBy`, `createdAt`, `updatedAt`. Přesné typy viz `src/lib/types.ts`.
- `publicAvailability/{datum}` — **jediná kolekce s veřejným `allow read`** (viz
  `firestore.rules`): `{ date, dronesTotal, dronesFree, canFly, updatedAt }`. Žádná
  jména ani kontakty, jen agregované počty pro veřejný kalendář `/dostupnost`.
  Appka nemá backend, tak se přepočítává rovnou z klienta přihlášeného člena týmu
  (`recomputePublicAvailability` v `src/lib/publicAvailability.ts`) — spouští se po
  uložení/smazání akce a po změně nedostupnosti pilota, vždy pro okno dnes+365 dní.
  Nevýhoda: data mírně zastarají, pokud pár dní nikdo z týmu appku vůbec neotevře.
  Prvotní naplnění (kolekce je jinak po nasazení prázdná) dělá jednorázově
  `node scripts/backfill-availability.mjs`.
- `posts/{slug}` — příspěvek na blogu, viz sekce Blog níže.

## Blog

Příspěvky (kolekce `posts`, `id` dokumentu == slug v URL) může založit kdokoli
přihlášený přes `/app/blog`, nebo je zakládá Claude Code přímo do databáze
skriptem `scripts/create-post.mjs` (viz komentář v souboru pro tvar JSONu a přepínač
`--prod` pro zápis do produkce).

Obrázek v textu příspěvku se vkládá na vlastní řádek jako `![popisek](odkaz)`, video
z YouTube jako `[video](odkaz)` (viz `src/components/PostContent.tsx`). Obrázky buď
odkazem na fotku hostovanou jinde (Google Disk apod.), nebo soubor v `public/blog/` a
odkaz `/blog/soubor.jpg`. Skutečné nahrávání souborů přímo v appce zatím není —
vyžadovalo by to Firebase Storage a přepnutí projektu na placený tarif (Blaze).

## Administrátorský přístup (service-account.json)

Pro skripty, co píšou přímo do produkční databáze (`scripts/create-post.mjs --prod`,
jednorázové bootstrapování dat), je potřeba `service-account.json` v kořeni projektu —
**nikdy se necommituje** (je v `.gitignore`). Nový klíč: Firebase Console → Project
settings → Service accounts → Generate new private key.

## Záloha produkční databáze

Projekt zatím jede na free plánu Spark, takže placené Firestore "Managed backups"
(automatické denní zálohy se retencí) nejdou zapnout — vyžadují plán Blaze
(propojenou platební metodu). Místo toho je tu jednoduchý ruční skript, co přes
`service-account.json` stáhne všechny kolekce (`team`, `drones`, `events`, `posts`)
do JSON souborů:

```bash
npm run backup
```

Ukládá do iCloud Drive, do `Zaloha_srncata/<datum>/` — macOS to samo synchronizuje
mimo tenhle konkrétní počítač. (Obsahuje osobní údaje pilotů, proto míří jen do
soukromého iCloud, nikdy ne do gitu.) Spouštěj to tak jednou za čas (např. před
větší úpravou dat nebo hromadným mazáním akcí). Až se projekt časem přepne na
Blaze, dává smysl přejít na `firebase firestore:backups:schedules:create`
(automatické, bez nutnosti na to pamatovat).

## Nasazení / update produkce

Push do GitHubu appku na produkci **sám o sobě nenasadí** — nasazení je záměrně ruční
krok (žádné automatické CI/CD), ať zveřejnění nové verze zůstává pod vaší kontrolou.

```bash
VITE_USE_EMULATORS=false npm run build   # build proti skutečnému Firebase projektu
npx firebase deploy --only hosting        # nahraje appku na Hosting
npx firebase deploy --only firestore:rules,firestore:indexes  # po změně pravidel/indexů
```

(`npm run deploy` dělá totéž, ale bez `VITE_USE_EMULATORS=false` — než se v `.env`
natrvalo přepne na `false`, spouštěj build ručně s tou proměnnou, ať se do produkce
neodešle appka napojená na emulátory.)

### DNS (Webglobe)

`zachransrncemsk.cz` a `piloti.zachransrncemsk.cz` míří na Firebase Hosting. Aktuální
záznamy (Webglobe admin → Doména → DNS → DNS záznamy):

- `A` (root) → `199.36.158.100`
- `TXT` (root) → `hosting-site=zachran-srnce-msk`
- `CNAME piloti` → `zachran-srnce-msk.web.app`
- `CNAME www` → `zachran-srnce-msk.web.app`

Kdyby bylo potřeba přidat další doménu/subdoménu, přesné hodnoty (včetně toho, co
případně smazat) ukáže Firebase Console → Hosting → Add custom domain.

## Co zatím chybí / plánované rozšíření

- **Fotky z akcí** — teď je jen textové políčko na odkaz (např. na Google Disk).
  Nahrávání fotek přímo v appce je připravené jako další krok, zatím záměrně vynechané
  (vyžadovalo by Firebase Storage + placený tarif).
- **Statistiky** (počty zachráněných srnčat v čase, podle pilota/oblasti) — až budou
  data z reálného provozu.
- **Veřejné stránky** `/tym` — první 4 lidi mají foto/roli, bio má zatím jen Vojtěch
  Barta, ostatní placeholder text (`src/pages/public/TeamPage.tsx`).

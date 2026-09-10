# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Web spolku + interní appka pro plánování letů s termovizním dronem při senosečích
(záchrana srnčat před sekačkami). Veřejný web (`/`, `/tym`, `/blog`, `/kontakt`,
`/dostupnost`) + neveřejná appka pro tým (`/app/*`, přihlášení přes Google) na
plánování akcí, evidenci dronů/vybavení/pilotů a psaní blogu. Živě na
https://zachransrncemsk.cz. React + TypeScript + Vite, Tailwind CSS 4, Firebase
(Auth, Firestore, Hosting) — **žádný vlastní backend**, appka mluví s Firestore
přímo z prohlížeče a `firestore.rules` je celá autorizační vrstva. Kompletní
datový model, DNS, zálohy a nasazení viz `README.md`.

## Příkazy

```bash
npm install
npm run dev              # appka na http://localhost:5173 (potřebuje běžící emulátory, viz níže)
npm run emulators        # Auth + Firestore emulátory + UI na http://127.0.0.1:4000
npm run seed             # jednorázově naplní emulátor ukázkovým týmem/drony/akcemi
npm run build            # tsc -b && vite build
npm run lint             # oxlint
```

Lokální vývoj vždy běží proti Firebase Local Emulator Suite, nikdy proti
skutečnému projektu (`.env` má `VITE_USE_EMULATORS=true`). Falešné Google
přihlášení v Auth emulátoru pustí jen e-mail, co už existuje jako dokument
`team/{email}` (naseedovaný pro `bartavoj@gmail.com`).

### Testy — tři nezávislé vrstvy, spustit všechny před commitem

```bash
npm test                                    # unit testy bez Firebase (src/lib/*.test.ts)
npx vitest run src/lib/maps.test.ts         # jeden konkrétní soubor
npx vitest run -t "vrátí null pro prázdný"  # podle názvu testu

npm run test:rules                          # firestore.rules, vlastní dočasný emulátor
npx firebase-tools emulators:exec --project demo-srncata --only firestore \
  "vitest run --config vitest.rules.config.ts -t <název>"   # jeden konkrétní rules test

npm run test:e2e                            # Playwright proti dev serveru + emulátorům
npx firebase-tools emulators:exec --project demo-srncata --only firestore,auth \
  "npx playwright test e2e/pilots.spec.ts"  # jeden konkrétní e2e soubor
```

**Po dokončení úlohy, před vytvořením gitového commitu, vždy spusť `npm test`,
`npm run test:rules` a `npm run test:e2e`.** Selhání oprav (nebo se zeptej), než
budeš pokračovat — nikdy necommituj se selhávajícími testy. Vynechat některou
vrstvu dává smysl, jen když změna do ní evidentně nemůže zasáhnout (např. úprava
jen textu v dokumentaci) — v případě pochybností spusť všechny tři.

`npm test` a dvojice `test:rules`/`test:e2e` se záměrně vzájemně vylučují: e2e a
rules testy potřebují Firebase CLI a běžící emulátor, tak jsou z výchozího běhu
Vitestu vyloučené (`exclude` v `vite.config.ts`) — obyčejné `npm test` tak nikdy
nepotřebuje síť ani Javu. Obě emulátorové sady si přes
`firebase emulators:exec --project demo-srncata` spustí **vlastní, jednorázový**
emulátor — nikdy nesahají na perzistentní data z `npm run emulators`/`npm run seed`.

## Architektura

**Model důvěry, ne systém oprávnění.** `firestore.rules` má jednu skutečnou
bránu, `isTeamMember()` (přihlášený + existuje `team/{email}` doc pro ten
e-mail), použitou skoro všude: kterýkoli člen týmu smí číst/psát drony,
vybavení, honitby, akce i navzájem své `team` záznamy. Jediná výjimka je
`isAdmin()` (natvrdo `bartavoj@gmail.com`), co jediný smí smazat *cizí* `team`
dokument — sám sebe si smí smazat kdokoli. `posts` navíc odděluje veřejné čtení
(`status == 'published'`) od čtení/zápisu jen pro tým. Při úpravě pravidel uprav
ve stejné změně i `firestore.rules.test.ts` — je to jediná věc, co ověřuje, že
tenhle model doopravdy platí.

**Realtime čtení, žádná agregace na serveru.** `src/lib/useCollection.ts`
obaluje `onSnapshot` pro každý seznamový pohled — stránky dostávají živě se
aktualizující pole, ne jednorázový fetch. Jeho závislost efektu sleduje jen
*typy* podmínek (`where`/`orderBy`), ne jejich hodnoty — `where(...)` postavené
na měnící se hodnotě by se tak znovu nepřihlásilo; buď předávej stabilní seznam
podmínek, nebo tuhle závislost oprav, než něco takového přidáš.

**Appka nemá backend, takže vedlejší efekty na zápisy řeší sám klient.** Žádná
Cloud Function nereaguje na zápisy sama. `recomputePublicAvailability()`
(`src/lib/publicAvailability.ts`) — jediné, co plní veřejnou kolekci
`publicAvailability` (jediné `allow read: if true` v `firestore.rules`) — se
volá explicitně po každém uložení/smazání akce a po změně nedostupnosti pilota
(viz `EventDetailPage`, `PilotsPage`), pokaždé přepočítá celé okno dnes+365 dní
znovu od začátku. Bez delší dobu žádné aktivity v appce tak může zastarat —
`AvailabilityPage` s tím počítá přes čistou, samostatně testovanou
`canGoToNextMonth`.

**Pipeline na pole/export je reálně používaná, ne jen UI.** `EventFieldsEditor`
dohledá hranici pole přes LPIS (`src/lib/lpis.ts`, veřejné WFS API státní
správy, v testech mockovaná síť) nebo podle bodu na mapě, a pak umí vyexportovat
letový plán, který piloti doopravdy létají: `src/lib/djiWpml.ts` (DJI WPML/KMZ
pro wayline misi Matrice 4T — meze výšky/rychlosti v `EventFieldsEditor` jsou
bezpečnostní omezení, ne jen kosmetika UI) a `src/lib/gpx.ts`. Kontrola
kolize pilota/dronu v `EventForm` je jen upozornění na stejný den (odškrtnutí k
potvrzení), ne tvrdá zábrana; nedostupnost pilota tvrdou zábranou je, ale jen u
akcí, co ještě nejsou uzavřené (`done`/`cancelled` jsou vyjmuté, viz podmínka
`isSettled`) — ať dodatečně přidaná dovolená zpětně nesmaže, kdo starou akci
doopravdy odlétal.

**Routování**: `src/App.tsx` používá datový router (`createBrowserRouter`) —
nutné, aby `useBlocker` v `EventForm` zachytil i odchod na jinou stránku uvnitř
appky (SPA navigaci), ne jen zavření tabu. Veřejné cesty jedou pod
`PublicLayout`; každá `/app/*` cesta plus samostatné `/mapa` a
`/app/akce/:id/tisk` jsou obalené `ProtectedRoute` (jen UX brána na klientovi —
skutečné vynucení je na `firestore.rules`).

**Administrátorské skripty** (`scripts/create-post.mjs --prod`,
`scripts/backup-prod.mjs`, jednorázové zakládání dat) se přihlašují přes
`service-account.json` (v `.gitignore`, Firebase Admin SDK — obchází veškerá
`firestore.rules`). Nikdy ho necommitovat; chybějící znovu vygenerovat přes
Firebase Console → Project settings → Service accounts.

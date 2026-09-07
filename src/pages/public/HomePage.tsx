import { useState } from "react";
import fawnPhoto from "../../assets/photos/o-nas.jpg";
import { Lightbox } from "../../components/Lightbox";
import { YouTubeFacade } from "../../components/YouTubeFacade";
import step1Image from "../../assets/photos/krok1-nahlaseni-pole.jpg";
import step2Image from "../../assets/photos/krok2-let-za-svitani.jpg";
import step3Image from "../../assets/photos/krok3-vyneseni-mladat.jpg";
import step4Image from "../../assets/photos/krok4-bezpecne-seceni.jpg";
import step5Image from "../../assets/photos/krok5-navrat-na-louku.jpg";

// Náhledy jednotlivých kroků — doplňují se postupně (viz Step níže).
// Kroky bez obrázku prostě náhled nezobrazí.
const STEP_IMAGES: Record<string, string | undefined> = {
  "1": step1Image,
  "2": step2Image,
  "3": step3Image,
  "4": step4Image,
  "5": step5Image,
};

// Zdroj: interní výroční zpráva "Záchrana srnčat 2026", období 13. 5. – 26. 6. 2026.
const SEASON_REGIONS = [
  { name: "Frýdecko", ha: 196, zachraneno: 48, podKosem: 13, vyhnano: 35 },
  { name: "Bruntálsko", ha: 221, zachraneno: 29, podKosem: 23, vyhnano: 6 },
  { name: "Ostravsko", ha: 279, zachraneno: 19, podKosem: 6, vyhnano: 13 },
  { name: "Opavsko", ha: 186, zachraneno: 15, podKosem: 9, vyhnano: 6 },
  { name: "Třinecko", ha: 18, zachraneno: 5, podKosem: 2, vyhnano: 3 },
];

const SEASON_PILOTS = [
  { name: "Vojtěch Barta", count: 42 },
  { name: "Markéta Káňová", count: 29 },
  { name: "Petr Pařák", count: 28 },
  { name: "Zuzana Kaločová", count: 9 },
  { name: "Jan Peterek", count: 8 },
  { name: "Karolína Machocká", count: 0 },
  { name: "Petr Michalčík", count: 0 },
];

const MAX_REGION = Math.max(...SEASON_REGIONS.map((r) => r.zachraneno));
const MAX_PILOT = Math.max(...SEASON_PILOTS.map((p) => p.count));
const POD_KOSEM = SEASON_REGIONS.reduce((sum, r) => sum + r.podKosem, 0);
const VYHNANO = SEASON_REGIONS.reduce((sum, r) => sum + r.vyhnano, 0);

export function HomePage() {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-10 sm:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-4xl font-bold sm:text-5xl">
              Než vyjede sekačka, proletí louku dron.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Srnčata se před nebezpečím neschovávají útěkem, ale tím, že zůstanou nehybně
              ležet v trávě — před sekačkou tak nemají prakticky žádnou šanci. Každý rok
              kvůli tomu zahynou stovky mláďat. My je najdeme termovizní kamerou ještě před
              sečením a v klidu přeneseme na okraj pole. Pak už může přijet traktor se
              sekačkou — a jakmile je senoseč hotová, srnčata vypustíme zpátky na louku za
              matkou.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/kontakt"
                className="rounded-full bg-brand px-6 py-3 font-semibold text-brand-ink"
              >
                Kontakty
              </a>
            </div>
          </div>
          <img
            src={fawnPhoto}
            alt="Srnče schované ve vysoké trávě, kterého si všimne termovizní kamera"
            className="aspect-[3/4] w-full max-w-sm justify-self-center rounded-2xl border border-line object-cover shadow-[var(--shadow)]"
          />
        </div>
      </section>

      <section className="border-y border-line bg-bg-raised">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Jak zásah probíhá</h2>
          <ol className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            <Step n="1" title="Nahlášení senoseče" image={STEP_IMAGES["1"]} onOpenImage={setLightbox}>
              Zemědělec nebo myslivec nám dá vědět, které pole se bude v následujících dnech
              sekat.
            </Step>
            <Step n="2" title="Let dronem" image={STEP_IMAGES["2"]} onOpenImage={setLightbox}>
              Pilot naplánuje let s termovizním dronem nejlépe brzo ráno, ale co nejkratší
              dobu před sečením.
            </Step>
            <Step n="3" title="Vynesení mláďat" image={STEP_IMAGES["3"]} onOpenImage={setLightbox}>
              Pilot navádí dobrovolníky na zemi přímo k nalezeným srnčatům. Ta odchytíme a
              v přepravce přeneseme do bezpečí, běhavější vyženeme mimo pole a hlídáme, že
              se nevrátí.
            </Step>
            <Step n="4" title="Bezpečné sečení" image={STEP_IMAGES["4"]} onOpenImage={setLightbox}>
              Jakmile je pole prolétané, dáme zemědělci zelenou a sečení může začít.
            </Step>
            <Step n="5" title="Návrat na louku" image={STEP_IMAGES["5"]} onOpenImage={setLightbox}>
              Po dosečení srnčata vypustíme zpátky a zkontrolujeme, že si je máma odvede.
            </Step>
          </ol>

          <div className="mx-auto mt-10 max-w-2xl">
            <YouTubeFacade videoId="Mhv6TyNBsPI" title="Záchrana srnčat" />
            <p className="mt-3 text-sm text-ink-soft">Záchrana srnčat — senoseč 2026 v akci.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-bg-raised">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Jak můžu pomoct?</h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            Každá pomoc se počítá — nemusíte umět létat s dronem.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-bg p-6">
              <h3 className="font-display text-lg font-bold">Jako dobrovolník na místě</h3>
              <p className="mt-2 text-ink-soft">
                Sledujte naše sociální sítě pro aktuality a zapojte se do dobrovolnických
                akcí v regionu — Instagram &middot; Facebook.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-bg p-6">
              <h3 className="font-display text-lg font-bold">Jako finanční zachránce</h3>
              <p className="mt-2 text-ink-soft">
                Přispějte na náš transparentní účet:{" "}
                <span className="font-mono-nums font-semibold text-ink">2503273659/2010</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand/40 bg-bg p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                Aktuální sbírka
              </p>
              <h3 className="mt-1 font-display text-xl font-bold">
                Sbíráme na druhý termovizní dron
              </h3>
              <p className="mt-2 max-w-2xl text-ink-soft">
                Jeden dron zvládne najednou jen jedno pole. Druhý dron (DJI Matrice 4T) by
                nám umožnil zasahovat na dvou místech současně, a zachránit tak víc
                srnčat. Cíl sbírky je 250 000 Kč — postupně od nabíjecí stanice až po
                kompletní dron schopný létat i v dešti.
              </p>
            </div>
            <a
              href="https://donio.cz/druhy-dron-na-zachranu-srncat-vice-moznosti-pomoci"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-full bg-brand px-6 py-3 text-center font-semibold text-brand-ink"
            >
              Podpořit sbírku ↗
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Sezóna 2026 v číslech</h2>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile value="116" label="zachráněných srnčat" />
          <StatTile value="49" label="výjezdů" />
          <StatTile value="900 ha" label="prolétaných luk" />
          <StatTile value="12,9" label="srnčat na 100 ha" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-bg-raised p-6">
            <h3 className="font-display text-lg font-bold">Zachráněno podle regionu</h3>
            <div className="mt-4 flex flex-col gap-3">
              {SEASON_REGIONS.map((r) => (
                <BarRow
                  key={r.name}
                  label={r.name}
                  value={r.zachraneno}
                  max={MAX_REGION}
                  color="var(--meadow)"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-bg-raised p-6">
              <h3 className="font-display text-lg font-bold">Jak jsme srnčata chránili</h3>
              <div className="mt-4 flex h-4 w-full overflow-hidden rounded-full">
                <div
                  style={{ width: `${(POD_KOSEM / (POD_KOSEM + VYHNANO)) * 100}%`, background: "var(--meadow)" }}
                />
                <div
                  style={{ width: `${(VYHNANO / (POD_KOSEM + VYHNANO)) * 100}%`, background: "var(--brand)" }}
                />
              </div>
              <div className="mt-3 flex justify-between text-sm text-ink-soft">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--meadow)" }} />
                  Pod košem: <span className="font-mono-nums font-semibold text-ink">{POD_KOSEM}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand)" }} />
                  Vyhnáno: <span className="font-mono-nums font-semibold text-ink">{VYHNANO}</span>
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-bg-raised p-6">
              <h3 className="font-display text-lg font-bold">Zapojení pilotů</h3>
              <p className="mt-1 text-xs text-ink-soft">
                U společných výjezdů dělený kredit — do budoucna propojíme s profily pilotů.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {SEASON_PILOTS.map((p) => (
                  <BarRow
                    key={p.name}
                    label={p.name}
                    value={p.count}
                    max={MAX_PILOT}
                    color="var(--status-done)"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-ink-soft">
          Zdroj: interní výroční zpráva. Regionální členění je pracovní komunikační rozdělení
          do pěti oblastí, "zachráněno" = součet srnčat pod košem a vyhnaných mimo sečenou
          plochu.
        </p>
      </section>

      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-5 text-center">
      <p className="font-mono-nums text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 text-ink-soft">{label}</span>
      <div className="h-2.5 flex-1 rounded-full bg-line">
        <div
          className="h-2.5 rounded-full"
          style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, background: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right font-mono-nums font-semibold">{value}</span>
    </div>
  );
}

function Step({
  n,
  title,
  image,
  onOpenImage,
  children,
}: {
  n: string;
  title: string;
  image?: string;
  onOpenImage: (image: { src: string; alt: string }) => void;
  children: React.ReactNode;
}) {
  return (
    <li className="flex h-full flex-col gap-2">
      <span className="font-mono-nums text-sm font-semibold text-brand">{n}</span>
      <h4 className="font-display text-lg font-bold">{title}</h4>
      <p className="flex-1 text-sm text-ink-soft">{children}</p>
      {image && (
        <button
          type="button"
          onClick={() => onOpenImage({ src: image, alt: title })}
          className="mt-1 h-28 overflow-hidden rounded-lg border border-line sm:h-32"
        >
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </button>
      )}
    </li>
  );
}

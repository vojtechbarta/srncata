import fawnPhoto from "../../assets/photos/o-nas.jpg";

export function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pt-20">
        <div className="grid items-center gap-10 sm:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Senoseč 2026 · Moravskoslezský kraj
            </p>
            <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
              Než vyjede sekačka, proletí louku dron.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-ink-soft">
              Srnčata se před nebezpečím neschovávají útěkem, ale strnutím v trávě — pro
              sekačku jsou tak neviditelná. My je najdeme termovizní kamerou za svítání,
              kdy je teplotní rozdíl mezi mládětem a chladnou loukou nejvyšší, a v klidu je
              přeneseme na okraj pole. Pak už může přijet traktor se sekačkou — a jakmile
              je senoseč hotová, srnčata vypustíme zpátky na louku za matkou.
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
            <Step n="1" title="Nahlášení pole">
              Zemědělec nebo myslivec nám dá vědět, které pole se bude v následujících dnech
              sekat.
            </Step>
            <Step n="2" title="Let za svítání">
              Pilot naplánuje let s termovizním dronem nejlépe brzo ráno, ale co nejkratší
              dobu před sečením.
            </Step>
            <Step n="3" title="Vynesení mláďat">
              Pilot navádí dobrovolníky na zemi přímo k nalezeným srnčatům. Ta odchytíme a
              v přepravce přeneseme do bezpečí, běhavější vyženeme mimo pole a hlídáme, že
              se nevrátí.
            </Step>
            <Step n="4" title="Bezpečné sečení">
              Jakmile je pole prolétané, dáme zemědělci zelenou a sečení může začít.
            </Step>
            <Step n="5" title="Návrat na louku">
              Po dosečení srnčata vypustíme zpátky a zkontrolujeme, že si je máma odvede.
            </Step>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-bg-raised p-6">
            <h3 className="font-display text-xl font-bold">Proč na tom záleží</h3>
            <p className="mt-2 text-ink-soft">
              Bez kontroly před sečením srnčata při mechanizovaném sečení běžně nepřežijí — a
              stejné riziko hrozí i dalším druhům hnízdícím v porostu. Pár minut letu s
              dronem tomu dokáže zabránit.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-bg-raised p-6">
            <h3 className="font-display text-xl font-bold">Kdo jsme</h3>
            <p className="mt-2 text-ink-soft">
              Parta dobrovolníků z Moravskoslezského kraje s termovizním dronem, kteří v
              sezóně senosečí vyjíždí na zavolání k okolním polím — zdarma a bez zbytečné
              byrokracie.
            </p>
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
    </>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2">
      <span className="font-mono-nums text-sm font-semibold text-brand">{n}</span>
      <h4 className="font-display text-lg font-bold">{title}</h4>
      <p className="text-sm text-ink-soft">{children}</p>
    </li>
  );
}

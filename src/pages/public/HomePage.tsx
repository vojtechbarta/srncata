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
              přeneseme na okraj pole.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:zachransrncemsk@gmail.com"
                className="rounded-full bg-brand px-6 py-3 font-semibold text-brand-ink"
              >
                Nahlásit pole k posečení
              </a>
              <a
                href="/kontakt"
                className="rounded-full border border-line px-6 py-3 font-semibold text-ink-soft hover:text-ink"
              >
                Kontakty
              </a>
            </div>
          </div>
          <ThermalHero />
        </div>
      </section>

      <section className="border-y border-line bg-bg-raised">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-2xl font-bold sm:text-3xl">Jak zásah probíhá</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-4">
            <Step n="1" title="Nahlášení pole">
              Zemědělec nebo myslivec nám dá vědět, které pole se bude v následujících dnech
              sekat.
            </Step>
            <Step n="2" title="Let za svítání">
              Pilot naplánuje let s termovizním dronem na dobu těsně před sečením, kdy je
              vidět nejlépe.
            </Step>
            <Step n="3" title="Vynesení mláďat">
              Nalezená srnčata v klidu přeneseme mimo dosah sekačky, aby na ně počkala matka.
            </Step>
            <Step n="4" title="Bezpečné sečení">
              Jakmile je pole prolétané, dáme zemědělci zelenou a sečení může začít.
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

/** Ilustrace odkazující na termovizní snímek louky — záměrně abstraktní, ne fotka. */
function ThermalHero() {
  return (
    <svg viewBox="0 0 320 260" className="w-full max-w-sm justify-self-center" aria-hidden="true">
      <rect x="0" y="0" width="320" height="260" rx="20" fill="var(--ink)" />
      <ellipse cx="160" cy="230" rx="230" ry="60" fill="#1c2a1f" />
      <circle cx="150" cy="130" r="70" fill="var(--brand)" opacity="0.85" />
      <circle cx="150" cy="130" r="38" fill="#fff3df" opacity="0.9" />
      <circle cx="230" cy="185" r="26" fill="var(--brand)" opacity="0.55" />
      <circle cx="230" cy="185" r="11" fill="#fff3df" opacity="0.8" />
      <g stroke="#fff3df" strokeOpacity="0.25" strokeWidth="1">
        <line x1="0" y1="60" x2="320" y2="60" />
        <line x1="0" y1="120" x2="320" y2="120" />
        <line x1="0" y1="180" x2="320" y2="180" />
      </g>
    </svg>
  );
}

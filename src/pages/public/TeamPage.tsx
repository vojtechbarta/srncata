// Skutečná jména, fotky a bio členů týmu doplňte sem — tohle je zatím
// jen připravená struktura stránky, ať se ví, kam informace patří.
const PLACEHOLDER_MEMBERS = [
  { role: "Pilot dronu" },
  { role: "Pilot dronu" },
  { role: "Pilot dronu" },
  { role: "Pilot dronu" },
  { role: "Koordinátor/ka" },
];

export function TeamPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Náš tým
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Pět lidí, dva drony, jedna sezóna</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Za spolkem stojí parta dobrovolníků, kteří v období senosečí vyjíždí na zavolání
        k okolním polím. Konkrétní jména a kontakty na jednotlivé piloty brzy doplníme.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PLACEHOLDER_MEMBERS.map((m, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-bg-raised p-6 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg text-2xl text-ink-soft">
              ?
            </div>
            <div>
              <p className="font-semibold">Jméno doplníme</p>
              <p className="text-sm text-ink-soft">{m.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import marketaPhoto from "../../assets/photos/tym/marketa-kanova.jpg";
import vojtechPhoto from "../../assets/photos/tym/vojtech-barta.jpg";
import petrPhoto from "../../assets/photos/tym/petr-parak.jpg";
import janPhoto from "../../assets/photos/tym/jan-peterek.jpg";

// Kdo je na téhle stránce, je nezávislé na tom, kdo má přístup do appky
// (kolekce `team` ve Firestore) — tohle je čistě veřejná prezentace,
// klidně jiná množina lidí. Když bude foto/bio pro dalšího člověka,
// stačí sem přidat další položku.
const MEMBERS = [
  {
    name: "Markéta Káňová",
    role: "Zakladatelka spolku, pilotka",
    photo: marketaPhoto,
    objectPosition: "center",
  },
  {
    name: "Vojtěch Barta",
    role: "Pilot, myslivec",
    photo: vojtechPhoto,
    objectPosition: "top",
  },
  {
    name: "Petr Pařák",
    role: "Pilot",
    photo: petrPhoto,
    objectPosition: "center",
  },
  {
    name: "Jan Peterek",
    role: "Pilot, psovod",
    photo: janPhoto,
    objectPosition: "50% 70%",
  },
];

export function TeamPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Náš tým
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Lidé za spolkem</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Parta dobrovolníků, kteří v období senosečí vyjíždí na zavolání k okolním polím.
        Postupně tu přibydou i další.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {MEMBERS.map((member) => (
          <div key={member.name} className="flex flex-col gap-3">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-bg-raised">
              <img
                src={member.photo}
                alt={member.name}
                style={{ objectPosition: member.objectPosition }}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">{member.name}</p>
              <p className="text-sm text-ink-soft">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import marketaPhoto from "../../assets/photos/tym/marketa-kanova.jpg";
import vojtechPhoto from "../../assets/photos/tym/vojtech-barta.jpg";
import petrPhoto from "../../assets/photos/tym/petr-parak.jpg";
import janPhoto from "../../assets/photos/tym/jan-peterek.jpg";

const PLACEHOLDER_BIO = "Bio zatím doplníme — proč u záchrany srnčat je a co ho k tomu přivedlo.";

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
    bio: PLACEHOLDER_BIO,
  },
  {
    name: "Vojtěch Barta",
    role: "Pilot, myslivec",
    photo: vojtechPhoto,
    objectPosition: "top",
    bio: `Se spolkem jsem se potkal na jednom z vyhánění u nás v honitbě. Slovo dalo slovo a během týdne jsem se k nim přidal jako pilot dronu.

Pro mě jako myslivce je ochrana a péče o zvěř hlavní poslání a záchrana srnčat při senosečích je toho součástí. Lidé se někdy ptají, proč srnčata zachraňujeme, když pak srnčí zvěř lovíme. Důvodů je hned několik:
1. Smrt pod sekačkou je pro srnče nehumánní, často dlouhá a bolestivá.
2. Srnče nemá absolutně žádnou šanci, jeho pudy mu velí ležet. Jsou i jiné metody, jako procházení louky se psy, ale ty nejsou tak efektivní jako dron.
3. Myslivecký odlov je průběrný, lovíme primárně slabé jedince. Sekačka si nevybírá.

Navíc jsem přesvědčen o tom, že obraz myslivosti je v očích veřejnosti docela pokroucen. Někdy bohužel oprávněně. A právě zde máme možnost spolupráce s dobrovolníky, nadšenci a širší veřejností. Možnost ukázat, že většina myslivců jsou normální lidé, zapálení pro přírodu a zvěř. Že do toho dáváme spoustu vlastního času a hlavně srdce.`,
  },
  {
    name: "Petr Parák",
    role: "Pilot",
    photo: petrPhoto,
    objectPosition: "center",
    bio: PLACEHOLDER_BIO,
  },
  {
    name: "Jan Peterek",
    role: "Pilot, psovod",
    photo: janPhoto,
    objectPosition: "50% 70%",
    bio: PLACEHOLDER_BIO,
  },
];

type Member = (typeof MEMBERS)[number];

export function TeamPage() {
  const [openMember, setOpenMember] = useState<Member | null>(null);

  return (
    <section className="mx-auto max-w-5xl px-5 py-14">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Náš tým
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Lidé za spolkem</h1>

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
              <button
                type="button"
                onClick={() => setOpenMember(member)}
                className="font-display text-lg font-bold leading-tight underline decoration-line decoration-2 underline-offset-4 hover:decoration-brand"
              >
                {member.name}
              </button>
              <p className="text-sm text-ink-soft">{member.role}</p>
            </div>
          </div>
        ))}
      </div>

      {openMember && <BioModal member={openMember} onClose={() => setOpenMember(null)} />}
    </section>
  );
}

function BioModal({ member, onClose }: { member: Member; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[70vh] w-[80vw] flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-bg-raised p-6 shadow-[var(--shadow)] sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Zavřít"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-bg text-ink"
        >
          ✕
        </button>
        <div className="flex items-center gap-4 pr-10">
          <img
            src={member.photo}
            alt={member.name}
            style={{ objectPosition: member.objectPosition }}
            className="h-16 w-16 shrink-0 rounded-full border border-line object-cover"
          />
          <div>
            <p className="font-display text-xl font-bold leading-tight">{member.name}</p>
            <p className="text-sm text-ink-soft">{member.role}</p>
          </div>
        </div>
        <div className="whitespace-pre-line text-ink-soft">{member.bio}</div>
      </div>
    </div>
  );
}

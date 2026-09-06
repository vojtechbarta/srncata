export function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Kontakt
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Nahlaste nám pole k posečení</h1>
      <p className="mt-4 text-ink-soft">
        Ozvěte se nám s dostatečným předstihem před plánovaným sečením — ideálně několik dní
        dopředu, ať stihneme naplánovat let za svítání.
      </p>

      <dl className="mt-10 flex flex-col gap-6">
        <ContactRow label="E-mail">
          <a href="mailto:zachransrncemsk@gmail.com" className="underline underline-offset-2">
            zachransrncemsk@gmail.com
          </a>
        </ContactRow>
        <ContactRow label="Telefon">
          <a href="tel:+420731935211" className="underline underline-offset-2">
            +420 731 935 211
          </a>
        </ContactRow>
        <ContactRow label="Sociální sítě">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Instagram
          </a>{" "}
          &middot;{" "}
          <a
            href="https://www.facebook.com/groups/831108238889551/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Facebook
          </a>
        </ContactRow>
      </dl>
    </section>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line pb-4 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-32 shrink-0 text-sm font-semibold uppercase tracking-wide text-ink-soft">
        {label}
      </dt>
      <dd className="text-lg">{children}</dd>
    </div>
  );
}

import { NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold uppercase tracking-wide transition-colors ${
    isActive ? "text-brand" : "text-ink-soft hover:text-ink"
  }`;

export function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-5 py-4">
          <NavLink to="/" className="flex items-center gap-2.5">
            <ThermalMark />
            <span className="font-display text-lg font-bold leading-none">
              Záchrana srnčat
              <span className="block text-[11px] font-mono font-normal tracking-widest text-ink-soft">
                MORAVSKOSLEZSKÝ KRAJ
              </span>
            </span>
          </NavLink>
          <nav className="flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              Domů
            </NavLink>
            <NavLink to="/tym" className={navLinkClass}>
              Tým
            </NavLink>
            <NavLink to="/blog" className={navLinkClass}>
              Blog
            </NavLink>
            <NavLink to="/kontakt" className={navLinkClass}>
              Kontakt
            </NavLink>
            <NavLink
              to="/app"
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Přihlášení pilotů
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-5xl px-5 py-8 text-sm text-ink-soft">
          <p>
            Záchrana srnčat MSK, z. s. &middot;{" "}
            <a href="mailto:zachransrncemsk@gmail.com" className="underline underline-offset-2">
              zachransrncemsk@gmail.com
            </a>{" "}
            &middot; +420 731 935 211
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Jednoduchá značka evokující termovizní kruh/heatmapu, ne doslovná silueta zvířete. */
function ThermalMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="var(--ink)" />
      <circle cx="15" cy="15" r="9.5" fill="var(--brand)" opacity="0.9" />
      <circle cx="15" cy="15" r="4" fill="#fff8ec" />
    </svg>
  );
}

import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold uppercase tracking-wide transition-colors ${
    isActive ? "text-brand" : "text-ink-soft hover:text-ink"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-lg font-semibold uppercase tracking-wide transition-colors ${
    isActive ? "text-brand" : "text-ink-soft"
  }`;

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Zavřít mobilní menu při každé změně stránky.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-svh flex-col bg-bg text-ink">
      <header className="relative border-b border-line">
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

          <nav className="hidden items-center gap-6 sm:flex">
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
            <NavLink to="/dostupnost" className={navLinkClass}>
              Dostupnost <span className="text-ink-soft">(Beta)</span>
            </NavLink>
            <NavLink
              to="/app"
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
            >
              Přihlášení pilotů
            </NavLink>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line sm:hidden"
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {menuOpen && (
          <nav className="absolute inset-x-0 top-full flex flex-col gap-5 border-b border-line bg-bg px-5 py-6 shadow-[var(--shadow)] sm:hidden">
            <NavLink to="/" end className={mobileNavLinkClass}>
              Domů
            </NavLink>
            <NavLink to="/tym" className={mobileNavLinkClass}>
              Tým
            </NavLink>
            <NavLink to="/blog" className={mobileNavLinkClass}>
              Blog
            </NavLink>
            <NavLink to="/kontakt" className={mobileNavLinkClass}>
              Kontakt
            </NavLink>
            <NavLink to="/dostupnost" className={mobileNavLinkClass}>
              Dostupnost <span className="text-ink-soft">(Beta)</span>
            </NavLink>
            <NavLink
              to="/app"
              className="rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-bg"
            >
              Přihlášení pilotů
            </NavLink>
          </nav>
        )}
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

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.5 3.5l11 11M14.5 3.5l-11 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

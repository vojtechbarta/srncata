import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-brand text-brand-ink" : "text-ink-soft hover:bg-bg-raised hover:text-ink"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-lg font-semibold transition-colors ${
    isActive ? "bg-brand text-brand-ink" : "text-ink-soft"
  }`;

const APP_LINKS = [
  { to: "/app/akce", label: "Akce" },
  { to: "/app/piloti", label: "Piloti" },
  { to: "/app/drony", label: "Drony" },
  { to: "/app/vybaveni", label: "Vybavení" },
  { to: "/app/honitby", label: "Honitby" },
  { to: "/app/blog", label: "Blog" },
];

export function AppLayout() {
  const { user, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Zavřít mobilní menu při každé změně stránky.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-svh flex-col bg-bg text-ink">
      <header className="relative border-b border-line bg-bg-raised">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <nav className="hidden items-center gap-1 sm:flex">
            {APP_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 text-sm sm:flex">
            <Link
              to="/"
              className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              Veřejný web
            </Link>
            <span className="text-ink-soft">{user?.displayName ?? user?.email}</span>
            <button
              onClick={() => signOutUser()}
              className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              Odhlásit
            </button>
          </div>

          <div className="flex w-full items-center justify-between gap-3 sm:hidden">
            <span className="truncate text-sm text-ink-soft">{user?.displayName ?? user?.email}</span>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line"
            >
              {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="absolute inset-x-0 top-full z-10 flex flex-col gap-2 border-b border-line bg-bg-raised px-5 py-4 shadow-[var(--shadow)] sm:hidden">
            {APP_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={mobileNavLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
              <Link
                to="/"
                className="rounded-lg border border-line px-3 py-2 text-center font-semibold text-ink-soft"
              >
                Veřejný web
              </Link>
              <button
                onClick={() => signOutUser()}
                className="rounded-lg border border-line px-3 py-2 font-semibold text-ink-soft"
              >
                Odhlásit
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        <Outlet />
      </main>
    </div>
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

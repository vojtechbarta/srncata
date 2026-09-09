import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? "bg-brand text-brand-ink" : "text-ink-soft hover:bg-bg-raised hover:text-ink"
  }`;

export function AppLayout() {
  const { user, signOutUser } = useAuth();

  return (
    <div className="flex min-h-svh flex-col bg-bg text-ink">
      <header className="border-b border-line bg-bg-raised">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              <NavLink to="/app/akce" className={navLinkClass}>
                Akce
              </NavLink>
              <NavLink to="/app/piloti" className={navLinkClass}>
                Piloti
              </NavLink>
              <NavLink to="/app/drony" className={navLinkClass}>
                Drony
              </NavLink>
              <NavLink to="/app/vybaveni" className={navLinkClass}>
                Vybavení
              </NavLink>
              <NavLink to="/app/honitby" className={navLinkClass}>
                Honitby
              </NavLink>
              <NavLink to="/app/blog" className={navLinkClass}>
                Blog
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        <Outlet />
      </main>
    </div>
  );
}

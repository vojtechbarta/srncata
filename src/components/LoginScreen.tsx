import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export function LoginScreen({ notOnTeam }: { notOnTeam: boolean }) {
  const { signIn, signOutUser, user } = useAuth();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-bg px-6 text-center text-ink">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink">
        <div className="h-8 w-8 rounded-full bg-brand" />
      </div>

      {notOnTeam ? (
        <>
          <div>
            <h1 className="font-display text-2xl font-bold">Účet {user?.email} není v týmu</h1>
            <p className="mx-auto mt-2 max-w-sm text-ink-soft">
              Tahle sekce je jen pro piloty spolku. Pokud si myslíš, že bys tu měl/a být, ozvi se
              někomu, kdo tě přidá do seznamu týmu.
            </p>
          </div>
          <button
            onClick={() => signOutUser()}
            className="rounded-full border border-line px-5 py-2.5 font-semibold text-ink-soft hover:text-ink"
          >
            Zkusit jiný účet
          </button>
        </>
      ) : (
        <>
          <div>
            <h1 className="font-display text-2xl font-bold">Přihlášení pilotů</h1>
            <p className="mx-auto mt-2 max-w-sm text-ink-soft">
              Plánování akcí a dronů je jen pro členy týmu. Přihlas se svým Google účtem.
            </p>
          </div>
          <button
            onClick={() => signIn()}
            className="flex items-center gap-3 rounded-full bg-ink px-6 py-3 font-semibold text-bg transition-opacity hover:opacity-90"
          >
            <GoogleG />
            Přihlásit se přes Google
          </button>
        </>
      )}

      <Link to="/" className="text-sm text-ink-soft underline underline-offset-2">
        Zpět na veřejný web
      </Link>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.36 0-4.35-1.6-5.06-3.74H.9v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.94 10.68A5.4 5.4 0 0 1 3.66 9c0-.58.1-1.15.28-1.68V4.99H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.01l3.04-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.99l3.04 2.33C4.65 5.18 6.64 3.58 9 3.58z"
      />
    </svg>
  );
}

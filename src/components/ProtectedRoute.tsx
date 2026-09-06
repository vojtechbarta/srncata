import type { ReactNode } from "react";
import { useAuth } from "../lib/AuthContext";
import { LoginScreen } from "./LoginScreen";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isTeamMember, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg text-ink-soft">
        Načítání…
      </div>
    );
  }

  if (!user || !isTeamMember) {
    return <LoginScreen notOnTeam={!!user && !isTeamMember} />;
  }

  return <>{children}</>;
}

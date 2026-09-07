import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

interface AuthState {
  /** null = ještě se zjišťuje, undefined = nikdo není přihlášený */
  user: User | null | undefined;
  /** je přihlášený uživatel na seznamu týmu (kolekce `team`)? */
  isTeamMember: boolean | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(null);
  const [isTeamMember, setIsTeamMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ?? undefined);
      if (firebaseUser?.email) {
        try {
          const memberDoc = await getDoc(doc(db, "team", firebaseUser.email));
          setIsTeamMember(memberDoc.exists());
        } catch (err) {
          // Typicky permission-denied, když e-mail není v `team` — pravidla
          // takový dotaz zamítnou, což ale pořád znamená "není v týmu", ne
          // chybu appky. Bez tohohle by přihlášení zůstalo trčet na "Načítání…".
          console.error("Nepodařilo se ověřit členství v týmu:", err);
          setIsTeamMember(false);
        }
      } else {
        setIsTeamMember(null);
      }
      setLoading(false);
    });
  }, []);

  const value: AuthState = {
    user,
    isTeamMember,
    loading,
    signIn: async () => {
      await signInWithPopup(auth, googleProvider);
    },
    signOutUser: async () => {
      await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth se musí použít uvnitř AuthProvider");
  return ctx;
}

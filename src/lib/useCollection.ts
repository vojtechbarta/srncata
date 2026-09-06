import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

/** Realtime odběr celé Firestore kolekce, typovaný na T (bez `id`, to se doplní ze snapshotu). */
export function useCollection<T>(
  path: string,
  constraints: QueryConstraint[] = [],
) {
  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, path), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
        setLoading(false);
      },
      (err) => {
        console.error(`Chyba při čtení kolekce ${path}:`, err);
        setLoading(false);
      },
    );
    return unsub;
  }, [path, JSON.stringify(constraints.map((c) => c.type))]);

  return { data, loading };
}

export { orderBy };

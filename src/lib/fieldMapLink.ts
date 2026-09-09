import { newId } from "./id";
import type { MapField } from "../components/FieldBoundaryMap";

const STORAGE_PREFIX = "fieldMap:";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hodin

interface StoredPayload {
  ts: number;
  fields: MapField[];
}

/**
 * Otevře mapu (jedno pole i souhrn víc polí) v novém okně/tabu — pro
 * `FieldMapPage`. Data se neposílají přímo v URL (u víc polí s hodně
 * vrcholy polygonu to snadno přesáhne limit délky URL a prohlížeč/hosting
 * to odmítne jako "414 URI Too Long") — místo toho jdou do `localStorage`
 * pod jednorázovým klíčem a v URL jde jen ten klíč. Funguje jen v rámci
 * stejného prohlížeče (localStorage není sdílený mezi zařízeními/tabama
 * v jiném originu) — pro "otevřít si mapu vedle sebe" to stačí.
 */
export function openFieldMap(fields: MapField[]): void {
  const id = newId();
  pruneOldEntries();
  try {
    const payload: StoredPayload = { ts: Date.now(), fields };
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(payload));
  } catch {
    // localStorage plný/nedostupný (soukromé okno apod.) — otevřeme aspoň
    // stránku, ta ukáže srozumitelnou chybu, že se mapu nepodařilo najít.
  }
  window.open(`/mapa?id=${id}`, "_blank", "noopener,noreferrer");
}

/** Načte data uložená funkcí `openFieldMap` — volá `FieldMapPage`. */
export function readFieldMap(id: string): MapField[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    if (!raw) return null;
    return (JSON.parse(raw) as StoredPayload).fields;
  } catch {
    return null;
  }
}

/** Uklidí staré záznamy, ať localStorage neroste do nekonečna — každé
 * otevření mapy přidává nový klíč a nic je samo od sebe nemaže. */
function pruneOldEntries(): void {
  try {
    const now = Date.now();
    const staleKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      try {
        const payload = JSON.parse(localStorage.getItem(key) ?? "") as StoredPayload;
        if (!payload.ts || now - payload.ts > MAX_AGE_MS) staleKeys.push(key);
      } catch {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore — úklid není kritický
  }
}

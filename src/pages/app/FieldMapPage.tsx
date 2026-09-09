import { useSearchParams } from "react-router-dom";
import { FieldBoundaryMap, type MapField } from "../../components/FieldBoundaryMap";

/**
 * Samostatná stránka jen s mapou jednoho pole/bodu (nebo souhrnnou mapou
 * všech polí akce) — bez zbytku appky kolem, ať se dá otevřít v novém okně
 * a třeba rovnou ukázat/sdílet. Data se posílají přímo v URL (parametr
 * "data", JSON — buď jeden objekt, nebo pole objektů), ne přes Firestore —
 * funguje to tak i pro rozpracovanou, ještě neuloženou akci. Odkaz se
 * generuje v EventFieldsEditor, u jednotlivé položky i u souhrnu.
 */
export function FieldMapPage() {
  const [params] = useSearchParams();
  const raw = params.get("data");

  let fields: MapField[] | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      fields = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      fields = null;
    }
  }

  if (!fields || fields.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg p-6 text-center text-ink-soft">
        Odkaz na mapu je neplatný nebo poškozený.
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-bg p-3">
      <FieldBoundaryMap
        fields={fields}
        captionMode={fields.length > 1 ? "number" : "none"}
        className="h-[calc(100svh-1.5rem)] w-full rounded-xl border border-line"
      />
    </div>
  );
}

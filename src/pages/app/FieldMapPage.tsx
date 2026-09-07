import { useSearchParams } from "react-router-dom";
import { FieldBoundaryMap, type MapField } from "../../components/FieldBoundaryMap";

/**
 * Samostatná stránka jen s mapou jednoho pole/bodu — bez zbytku appky
 * kolem, ať se dá otevřít v novém okně a třeba rovnou ukázat/sdílet.
 * Data se posílají přímo v URL (parametr "data", JSON), ne přes
 * Firestore — funguje to tak i pro rozpracovanou, ještě neuloženou akci.
 * Odkaz se generuje v EventFieldsEditor u každé položky.
 */
export function FieldMapPage() {
  const [params] = useSearchParams();
  const raw = params.get("data");

  let field: MapField | null = null;
  if (raw) {
    try {
      field = JSON.parse(raw);
    } catch {
      field = null;
    }
  }

  if (!field) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg p-6 text-center text-ink-soft">
        Odkaz na mapu je neplatný nebo poškozený.
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-bg p-3">
      <FieldBoundaryMap
        fields={[field]}
        captionMode="none"
        className="h-[calc(100svh-1.5rem)] w-full rounded-xl border border-line"
      />
    </div>
  );
}

import { useSearchParams } from "react-router-dom";
import { FieldBoundaryMap } from "../../components/FieldBoundaryMap";
import { readFieldMap } from "../../lib/fieldMapLink";

/**
 * Samostatná stránka jen s mapou jednoho pole/bodu (nebo souhrnnou mapou
 * všech polí akce) — bez zbytku appky kolem, ať se dá otevřít v novém okně
 * a třeba rovnou ukázat/sdílet. Data se neposílají v URL (u víc polí by to
 * snadno přesáhlo limit délky URL), ale v `localStorage` — otevírá se přes
 * `openFieldMap`, volané z EventFieldsEditor u jednotlivé položky i u
 * souhrnu, funguje to tak i pro rozpracovanou, ještě neuloženou akci.
 */
export function FieldMapPage() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const fields = id ? readFieldMap(id) : null;

  if (!fields || fields.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg p-6 text-center text-ink-soft">
        Odkaz na mapu je neplatný, poškozený nebo už vypršel — zkuste ho otevřít znovu.
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

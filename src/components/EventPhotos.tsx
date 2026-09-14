import { useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadEventPhoto, deleteEventPhoto } from "../lib/eventPhotos";
import type { EventPhoto } from "../lib/types";
import { Lightbox } from "./Lightbox";

interface Props {
  eventId: string;
  photos: EventPhoto[];
  coverPhotoId: string | null;
}

/**
 * Galerie a upload fotek k akci — umístěná úplně dole v detailu akce,
 * mimo hlavní formulář (viz EventDetailPage). Na rozdíl od ostatních
 * polí se každá změna (nahrání, smazání, výběr náhledu) ukládá rovnou
 * do Firestore, ne až kliknutím na "Uložit" v EventForm — fotka je do
 * Storage nahraná okamžitě, odkládat by šlo jen uložení odkazu na ni,
 * což by appku jen matlo (tvářila by fotku jako přidanou, i než by se
 * to doopravdy uložilo). Odkaz na Disk (`photosLink` v EventForm)
 * zůstává nezávisle vedle — pro fotky v plné velikosti nebo jiné
 * soubory.
 *
 * `photos`/`coverPhotoId` props jsou jen počáteční hodnota — EventDetailPage
 * načítá akci jednorázově (getDoc, ne živé onSnapshot), takže by se sem
 * po vlastním zápisu nikdy nedostala čerstvá data zpátky. Galerie si
 * proto drží vlastní stav a po každém úspěšném zápisu ho aktualizuje
 * sama (optimisticky), ne že by čekala na nové props.
 */
export function EventPhotos({ eventId, photos: initialPhotos, coverPhotoId: initialCoverPhotoId }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [coverPhotoId, setCoverPhotoId] = useState(initialCoverPhotoId);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Index do `photos`, ne URL přímo — díky tomu se dá jednoduše přepínat
  // na další/předchozí fotku (viz `lightboxPhoto` a šipky v Lightboxu).
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  // Vybraná fotka podle coverPhotoId, jinak první nahraná — stejné
  // pravidlo jako `coverPhoto()` v src/lib/eventPhotos.ts.
  const effectiveCoverId = (coverPhotoId && photos.some((p) => p.id === coverPhotoId) ? coverPhotoId : null) ??
    photos[0]?.id ??
    null;

  async function save(nextPhotos: EventPhoto[], nextCoverId: string | null) {
    await updateDoc(doc(db, "events", eventId), { photos: nextPhotos, coverPhotoId: nextCoverId });
    setPhotos(nextPhotos);
    setCoverPhotoId(nextCoverId);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(files.length);
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadEventPhoto(eventId, file)));
      const nextPhotos = [...photos, ...uploaded];
      // Automaticky vybrat náhled jen když ještě žádný není (typicky
      // úplně první fotka k akci) — další uploady už vybraný náhled nemění.
      const nextCoverId = effectiveCoverId ?? uploaded[0]?.id ?? null;
      await save(nextPhotos, nextCoverId);
    } catch (err) {
      // Syrová chybová hláška z prohlížeče (např. "The source image could
      // not be decoded.") by pilotovi nic neřekla — necháme ji jen v
      // konzoli pro ladění, appka ukáže vlastní srozumitelný text.
      console.error("Nahrání fotky selhalo:", err);
      setError("Nahrání fotky se nepovedlo — zkontroluj, že je to platný obrázek (JPEG, PNG, HEIC…).");
    } finally {
      setUploading(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(photo: EventPhoto) {
    setError(null);
    try {
      await deleteEventPhoto(eventId, photo);
      const nextPhotos = photos.filter((p) => p.id !== photo.id);
      const nextCoverId = effectiveCoverId === photo.id ? (nextPhotos[0]?.id ?? null) : effectiveCoverId;
      await save(nextPhotos, nextCoverId);
    } catch (err) {
      console.error("Smazání fotky selhalo:", err);
      setError("Smazání fotky se nepovedlo, zkus to prosím znovu.");
    }
  }

  async function handleSetCover(photo: EventPhoto) {
    setError(null);
    try {
      await save(photos, photo.id);
    } catch (err) {
      console.error("Nastavení náhledu selhalo:", err);
      setError("Nastavení náhledu se nepovedlo, zkus to prosím znovu.");
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Fotky</h2>
        <div className="flex items-center gap-3">
          {uploading > 0 && <span className="text-sm text-ink-soft">Nahrávám {uploading}…</span>}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading > 0}
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-ink disabled:opacity-60"
          >
            + Přidat fotky
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-status-cancelled">{error}</p>}

      {photos.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          Zatím žádné fotky — pro plnou velikost nebo jiné soubory pořád jde použít odkaz na Disk výše.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => {
            const isCover = photo.id === effectiveCoverId;
            return (
              <div key={photo.id} className="flex flex-col gap-1.5 rounded-xl border border-line bg-bg p-1.5">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(photos.indexOf(photo))}
                  className="aspect-square overflow-hidden rounded-lg"
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                </button>
                <div className="flex items-center justify-between gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetCover(photo)}
                    disabled={isCover}
                    title={isCover ? "Tohle je náhled akce v seznamu" : "Nastavit jako náhled"}
                    className={`rounded-lg px-2 py-1 font-semibold ${
                      isCover ? "text-brand" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {isCover ? "★ Náhled" : "☆ Nastavit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    aria-label="Smazat fotku"
                    className="rounded-lg px-2 py-1 font-semibold text-ink-soft hover:text-status-cancelled"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightboxPhoto && (
        <Lightbox
          src={lightboxPhoto.url}
          alt="Fotka z akce"
          onClose={() => setLightboxIndex(null)}
          onPrev={
            photos.length > 1
              ? () => setLightboxIndex((i) => ((i ?? 0) - 1 + photos.length) % photos.length)
              : undefined
          }
          onNext={
            photos.length > 1 ? () => setLightboxIndex((i) => ((i ?? 0) + 1) % photos.length) : undefined
          }
        />
      )}
    </section>
  );
}

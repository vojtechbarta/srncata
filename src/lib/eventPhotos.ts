// Fotky k akci — appka nemá backend, takže úplně všechno (HEIC→JPEG,
// zmenšení) běží v prohlížeči, ne na serveru. Uloženo ve Firebase Storage
// pod events/{eventId}/{fotoId}.jpg (viz storage.rules — čte/píše jen
// tým, stejný model jako firestore.rules). Odkaz na plnou velikost nebo
// jiné soubory zůstává řešený polem `photosLink` (Google Disk) —
// tohle je jen pro fotky přímo v appce, zmenšené kvůli místu.
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";
import { newId } from "./id";
import type { EventPhoto, RescueEvent } from "./types";

/** Delší strana fotky po zmenšení — appka nikdy neukládá originál
 *  z mobilu (typicky 3–8 MB), jen tuhle zmenšenou kopii. */
const MAX_DIMENSION = 1900;
const JPEG_QUALITY = 0.85;

function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  // iOS appku/prohlížeč občas pošle HEIC s prázdným nebo obecným MIME
  // typem (např. application/octet-stream) — dohledáme aspoň podle přípony.
  return /\.hei[cf]$/i.test(file.name);
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  // Knihovna má vlastní WASM dekodér (libheif) o velikosti stovek kB —
  // dynamický import, ať ho stáhne jen prohlížeč, co opravdu nahrává HEIC
  // (typicky rovnou z iPhonu), ne každý návštěvník appky.
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  // U vícesnímkových HEIC (burst) vrátí pole — appka řeší jednu fotku,
  // bereme první snímek.
  return Array.isArray(result) ? result[0] : result;
}

/** Zmenší na max. MAX_DIMENSION na delší straně (nikdy nezvětšuje) a
 *  překóduje na JPEG. `createImageBitmap` s `imageOrientation:
 *  "from-image"` mimochodem sám narovná EXIF rotaci z mobilu, takže
 *  výsledek je vždy správně otočený bez ruční práce s EXIF tagy. */
async function resizeToJpeg(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D kontext není v tomhle prohlížeči dostupný.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Převod obrázku na JPEG selhal."))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
  } finally {
    bitmap.close();
  }
}

/** Připraví soubor z file inputu na upload — HEIC/HEIF nejdřív převede
 *  na JPEG, pak cokoli zmenší na max. {@link MAX_DIMENSION} px. */
export async function processPhotoFile(file: File): Promise<Blob> {
  const source = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
  return resizeToJpeg(source);
}

function storagePath(eventId: string, photoId: string): string {
  return `events/${eventId}/${photoId}.jpg`;
}

/** Zpracuje a nahraje jednu fotku k akci, vrátí záznam na uložení do
 *  `RescueEvent.photos` (appka o Storage cestě nemusí vědět nic víc, jde
 *  vždy dopočítat z eventId + photo.id — viz `deleteEventPhoto`). */
export async function uploadEventPhoto(eventId: string, file: File): Promise<EventPhoto> {
  const jpeg = await processPhotoFile(file);
  const id = newId();
  const fileRef = ref(storage, storagePath(eventId, id));
  await uploadBytes(fileRef, jpeg, { contentType: "image/jpeg" });
  const url = await getDownloadURL(fileRef);
  return { id, url, createdAt: new Date().toISOString() };
}

export async function deleteEventPhoto(eventId: string, photo: EventPhoto): Promise<void> {
  await deleteObject(ref(storage, storagePath(eventId, photo.id)));
}

/** Foto, co appka ukazuje jako náhled (na kartě v seznamu akcí i nahoře
 *  v galerii) — vybrané přes `coverPhotoId`, nebo první nahrané, když
 *  nic vybrané není. Starší akce (založené před touhle funkcí appky)
 *  pole `photos`/`coverPhotoId` ve Firestore vůbec nemají, i když je typ
 *  `RescueEvent` má napevno — proto `?? []`/volitelné `coverPhotoId`
 *  tady, ne spoléhání na to, že tam vždycky opravdu jsou. */
export function coverPhoto(
  event: Partial<Pick<RescueEvent, "photos" | "coverPhotoId">>,
): EventPhoto | null {
  const photos = event.photos ?? [];
  if (photos.length === 0) return null;
  const selected = event.coverPhotoId ? photos.find((p) => p.id === event.coverPhotoId) : null;
  return selected ?? photos[0];
}

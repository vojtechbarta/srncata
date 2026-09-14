import { useEffect } from "react";

/**
 * Fullscreen náhled obrázku po kliknutí na náhled — zavírá se křížkem, klikem
 * mimo nebo Esc. `onPrev`/`onNext` jsou nepovinné — bez nich (např. na
 * HomePage, kde jde o samostatné obrázky kroků, ne galerii) se šipky na
 * přepínání nezobrazí.
 */
export function Lightbox({
  src,
  alt,
  onClose,
  onPrev,
  onNext,
}: {
  src: string;
  alt: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8"
    >
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full rounded-xl object-contain shadow-[var(--shadow)]"
      />
      {onPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Předchozí fotka"
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg-raised text-lg text-ink"
        >
          ‹
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Další fotka"
          className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-bg-raised text-lg text-ink"
        >
          ›
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Zavřít"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg-raised text-lg text-ink"
      >
        ✕
      </button>
    </div>
  );
}

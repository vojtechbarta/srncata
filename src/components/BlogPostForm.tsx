import { useState } from "react";
import type { BlogPost, NewBlogPost, PostStatus, TeamMember } from "../lib/types";
import { slugify } from "../lib/slug";

interface Props {
  initial?: BlogPost;
  team: TeamMember[];
  onSave: (data: NewBlogPost) => void;
  onDelete?: () => void;
  saving?: boolean;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BlogPostForm({ initial, team, onSave, onDelete, saving }: Props) {
  const isNew = !initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [status, setStatus] = useState<PostStatus>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(initial?.publishedAt?.slice(0, 10) ?? todayIso());
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      slug: isNew ? slugify(slug || title) : initial.slug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      author: author.trim(),
      status,
      publishedAt: new Date(publishedAt).toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-wrap gap-2">
        {(["draft", "published"] as PostStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              status === s
                ? "border-brand bg-brand text-brand-ink"
                : "border-line text-ink-soft hover:text-ink"
            }`}
          >
            {s === "draft" ? "Koncept" : "Zveřejněno"}
          </button>
        ))}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-ink-soft">Titulek</span>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="rounded-lg border border-line bg-bg px-3 py-2"
            placeholder="např. Jak dopadla letošní senoseč"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-ink-soft">
            Adresa (slug){!isNew && " — po založení se už nemění"}
          </span>
          <input
            value={slug}
            disabled={!isNew}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className="rounded-lg border border-line bg-bg px-3 py-2 font-mono-nums disabled:opacity-60"
            placeholder="jak-dopadla-letosni-senosec"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-ink-soft">Krátký popisek do seznamu</span>
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-2"
            placeholder="jedna nebo dvě věty, uvidí je lidé v přehledu blogu"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-soft">Datum vydání</span>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-2 font-mono-nums"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-ink-soft">Autor</span>
          <input
            list="blog-authors"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="rounded-lg border border-line bg-bg px-3 py-2"
            placeholder="jméno"
          />
          <datalist id="blog-authors">
            {team.map((m) => (
              <option key={m.id} value={m.name} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-semibold text-ink-soft">Text příspěvku</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            required
            className="rounded-lg border border-line bg-bg px-3 py-2"
            placeholder="Odstavce odděl prázdným řádkem — tak se zalomí i na webu."
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand px-6 py-2.5 font-semibold text-brand-ink disabled:opacity-60"
        >
          {saving ? "Ukládám…" : "Uložit"}
        </button>

        {onDelete &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-soft">Opravdu smazat?</span>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white"
              >
                Smazat
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink-soft"
              >
                Zrušit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-ink-soft hover:text-red-600"
            >
              Smazat příspěvek
            </button>
          ))}
      </div>
    </form>
  );
}

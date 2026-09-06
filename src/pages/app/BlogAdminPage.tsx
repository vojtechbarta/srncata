import { useState } from "react";
import { Link } from "react-router-dom";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { BlogPost } from "../../lib/types";
import { formatDateShort } from "../../lib/format";

export function BlogAdminPage() {
  const { data: posts, loading } = useCollection<BlogPost>("posts", [
    orderBy("publishedAt", "desc"),
  ]);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const filtered = posts.filter((p) => filter === "all" || p.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Blog</h1>
        <Link
          to="/app/blog/nova"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink"
        >
          + Nový příspěvek
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "draft", "published"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === s ? "border-ink bg-ink text-bg" : "border-line text-ink-soft hover:text-ink"
            }`}
          >
            {s === "all" ? "Vše" : s === "draft" ? "Koncepty" : "Zveřejněné"} (
            {s === "all" ? posts.length : posts.filter((p) => p.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft">Načítání…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
          Zatím žádné příspěvky.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((post) => (
            <Link
              key={post.id}
              to={`/app/blog/${post.id}`}
              className="flex flex-col gap-1 rounded-2xl border border-line bg-bg-raised p-4 shadow-[var(--shadow)] transition-opacity hover:opacity-80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-display text-lg font-bold leading-tight">{post.title}</p>
                <p className="text-sm text-ink-soft">
                  {formatDateShort(post.publishedAt)} · {post.author || "bez autora"}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                  post.status === "published"
                    ? "bg-status-confirmed-bg text-status-confirmed"
                    : "bg-status-draft-bg text-status-draft"
                }`}
              >
                {post.status === "published" ? "Zveřejněno" : "Koncept"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

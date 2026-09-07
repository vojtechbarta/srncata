import { where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useCollection, orderBy } from "../../lib/useCollection";
import type { BlogPost } from "../../lib/types";
import { formatDateShort } from "../../lib/format";
import { extractFirstImage } from "../../lib/postContent";

export function BlogPage() {
  const { data: posts, loading } = useCollection<BlogPost>("posts", [
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand">
        Blog
      </p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Novinky ze senosečí</h1>
      <p className="mt-4 text-ink-soft">
        Zprávy z terénu, výsledky sezóny a další novinky ze života spolku.
      </p>

      {loading ? (
        <p className="mt-10 text-ink-soft">Načítání…</p>
      ) : posts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
          Zatím tu nic není — první příspěvek brzy přidáme.
        </p>
      ) : (
        <div className="mt-10 flex flex-col gap-6">
          {posts.map((post) => {
            const cover = extractFirstImage(post.content);
            return (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="flex gap-5 rounded-2xl border border-line bg-bg-raised p-4 shadow-[var(--shadow)] transition-opacity hover:opacity-85 sm:p-6"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-bg sm:h-32 sm:w-32">
                  {cover && (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="font-mono-nums text-sm text-ink-soft">
                    {formatDateShort(post.publishedAt)}
                  </span>
                  <h2 className="font-display text-xl font-bold">{post.title}</h2>
                  {post.excerpt && <p className="text-ink-soft">{post.excerpt}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

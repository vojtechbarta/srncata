import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { BlogPost } from "../../lib/types";
import { formatDateShort } from "../../lib/format";
import { PostContent } from "../../components/PostContent";

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null | undefined>(null);

  useEffect(() => {
    if (!slug) return;
    getDoc(doc(db, "posts", slug))
      .then((snap) => {
        setPost(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<BlogPost, "id">) }) : undefined);
      })
      .catch(() => setPost(undefined));
  }, [slug]);

  if (post === null) {
    return <section className="mx-auto max-w-2xl px-5 py-14 text-ink-soft">Načítání…</section>;
  }

  if (!post) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-14">
        <p className="text-ink-soft">Příspěvek nenalezen.</p>
        <Link to="/blog" className="mt-4 inline-block text-brand underline underline-offset-2">
          ← Zpět na blog
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <Link to="/blog" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Blog
      </Link>
      <p className="mt-4 font-mono-nums text-sm text-ink-soft">
        {formatDateShort(post.publishedAt)} {post.author && `· ${post.author}`}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{post.title}</h1>
      <div className="mt-6">
        <PostContent content={post.content} />
      </div>
    </article>
  );
}

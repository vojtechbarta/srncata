import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useCollection } from "../../lib/useCollection";
import type { BlogPost, NewBlogPost, TeamMember } from "../../lib/types";
import { BlogPostForm } from "../../components/BlogPostForm";

export function BlogPostEditPage() {
  const { id } = useParams();
  const isNew = id === "nova";
  const navigate = useNavigate();

  const { data: team } = useCollection<TeamMember>("team");

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew || !id) return;
    getDoc(doc(db, "posts", id)).then((snap) => {
      if (snap.exists()) setPost({ id: snap.id, ...(snap.data() as Omit<BlogPost, "id">) });
      setLoading(false);
    });
  }, [id, isNew]);

  async function handleSave(data: NewBlogPost) {
    setSaving(true);
    setError("");
    const now = new Date().toISOString();
    try {
      if (isNew) {
        const existing = await getDocs(
          query(collection(db, "posts"), where("slug", "==", data.slug)),
        );
        if (!existing.empty) {
          setError(
            `Adresa "${data.slug}" už existuje, uprav titulek nebo adresu příspěvku.`,
          );
          return;
        }
        await setDoc(doc(db, "posts", data.slug), {
          ...data,
          createdAt: now,
          updatedAt: now,
        });
        navigate("/app/blog");
      } else if (id) {
        await setDoc(doc(db, "posts", id), { ...data, updatedAt: now }, { merge: true });
        navigate("/app/blog");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    await deleteDoc(doc(db, "posts", id));
    navigate("/app/blog");
  }

  if (loading) return <p className="text-ink-soft">Načítání…</p>;
  if (!isNew && !post) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-soft">Příspěvek nenalezen.</p>
        <Link to="/app/blog" className="text-brand underline underline-offset-2">
          Zpět na blog
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/app/blog" className="text-sm font-semibold text-ink-soft hover:text-ink">
        ← Blog
      </Link>
      <h1 className="font-display text-2xl font-bold">
        {isNew ? "Nový příspěvek" : post?.title}
      </h1>
      {error && (
        <p className="rounded-lg bg-red-600/10 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
      <BlogPostForm
        initial={post ?? undefined}
        team={team}
        onSave={handleSave}
        onDelete={isNew ? undefined : handleDelete}
        saving={saving}
      />
    </div>
  );
}

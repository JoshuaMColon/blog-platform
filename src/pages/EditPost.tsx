import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import RichTextEditor from "../components/RichTextEditor";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import toast from 'react-hot-toast'
import CoverImageUpload from '../components/CoverImageUpload'
import { generateUniqueSlug } from '../utils/slugify'

const EditPost = () => {
  const { slug: currentSlug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [postId, setPostId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverImage, setCoverImage] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq('slug', currentSlug)
        .single();

      if (error || !data) {
        navigate("/");
        return;
      }

      // Redirect if not the owner
      if (data.user_id !== user?.id) {
        navigate("/");
        return;
      }

      setPostId(data.id);
      setTitle(data.title);
      setContent(data.content);
      setTags(data.tags?.join(", ") || "");
      setCoverImage(data.cover_image || '')
      setLoading(false);
    };

    fetchPost();
  }, [currentSlug, user, navigate]);

  const handleSave = async (published: boolean) => {
    if (!title.trim()) return setError("Title is required");
    if (!content.trim()) return setError("Content is required");

    setSaving(true);
    setError("");

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const newSlug = await generateUniqueSlug(title, supabase, postId)

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        content,
        tags: tagsArray,
        published,
        cover_image: coverImage || null,
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', currentSlug);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    toast.success('Post saved!')
    navigate(`/post/${newSlug}`);
  };

  if (loading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto p-8">
          <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            $ loading post...
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="text-xs font-mono tracking-widest mb-1" style={{ color: 'var(--accent)' }}>
            // editing
          </div>
          <h1 className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            post.edit()
          </h1>
        </div>

        {error && (
          <div className="border border-red-400 bg-red-500 bg-opacity-10 text-red-400 p-3 rounded mb-4 text-xs font-mono">
            <span className="font-bold">ERROR:</span> {error}
          </div>
        )}

        <div
          className="rounded-lg border p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Cover Image */}
          <CoverImageUpload
            currentImage={coverImage}
            onUpload={(url) => setCoverImage(url)}
            onRemove={() => setCoverImage('')}
          />

          {/* Title */}
          <div>
            <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm font-mono border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="Enter your post title..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ TAGS <span style={{ color: 'var(--text-secondary)' }}>(comma separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm font-mono border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="react, typescript, webdev..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-mono mb-2 tracking-widest" style={{ color: 'var(--accent)' }}>
              $ CONTENT
            </label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end flex-wrap">
            <button
              onClick={() => navigate(`/post/${currentSlug}`)}
              className="px-4 py-2 rounded font-mono text-xs border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              cancel()
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 rounded font-mono text-xs border transition-all disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              save_draft()
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 rounded font-mono text-xs font-bold transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--btn-text)' }}
            >
              {saving ? '> saving...' : '> save_publish()'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import RichTextEditor from "../components/RichTextEditor";
import { useAuth } from "../context/useAuth";
import { supabase } from "../lib/supabase";
import toast from 'react-hot-toast'
import CoverImageUpload from '../components/CoverImageUpload'

const EditPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverImage, setCoverImage] = useState('')

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
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

      setTitle(data.title);
      setContent(data.content);
      setTags(data.tags?.join(", ") || "");
      setCoverImage(data.cover_image || '')
      setLoading(false);
    };

    fetchPost();
  }, [id, user, navigate]);

  const handleSave = async (published: boolean) => {
    if (!title.trim()) return setError("Title is required");
    if (!content.trim()) return setError("Content is required");

    setSaving(true);
    setError("");

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase
      .from("posts")
      .update({
        title,
        content,
        tags: tagsArray,
        published,
        cover_image: coverImage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }
    toast.success('Post saved!')
    navigate(`/post/${id}`);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-8">
          <p className="text-gray-500">Loading post...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Edit Post</h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Cover Image */}
          <CoverImageUpload
            currentImage={coverImage}
            onUpload={(url) => setCoverImage(url)}
            onRemove={() => setCoverImage('')}
          />

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your post title..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="react, typescript, webdev..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <RichTextEditor content={content} onChange={setContent} />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => navigate(`/post/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;

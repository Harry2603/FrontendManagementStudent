import { useState, useCallback } from "react";

export default function AnnouncementForm({ onCreate, isSubmitting, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!title.trim() || !content.trim()) {
        setError("Please enter both a title and content.");
        return;
      }
      const result = await onCreate({
        title: title.trim(),
        content: content.trim(),
      });
      if (result.success) {
        setTitle("");
        setContent("");
        setError("");
        onClose();
      } else {
        setError("Unable to create the announcement. Please try again later.");
      }
    },
    [title, content, onCreate, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-form-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2
            id="announcement-form-title"
            className="text-lg font-semibold text-gray-900"
          >
            Create Announcement
          </h2>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content"
          rows={5}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        />
        {/* TODO: thêm select Course/All khi backend hỗ trợ target course. */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}

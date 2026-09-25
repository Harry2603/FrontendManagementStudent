import CreatorBadge from "./CreatorBadge";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnnouncementList({
  items,
  pageNumber,
  totalPages,
  isLoading,
  error,
  onNextPage,
  onPrevPage,
  onSelect,
}) {
  if (error) {
    return (
      <p className="text-sm text-red-600">
        Unable to load announcements. Please try again.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">Announcements</h2>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">No announcements yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-b border-gray-100 pb-3 last:border-0"
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="block w-full text-left hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <CreatorBadge role={item.user?.role} />
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.content}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                  <span>{item.user?.fullName ?? "Anonymous"}</span>
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            onClick={onPrevPage}
            disabled={pageNumber <= 1 || isLoading}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {pageNumber}/{totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={pageNumber >= totalPages || isLoading}
            className="rounded border border-gray-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

import CreatorBadge from "./CreatorBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Announcements
      </h2>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400">No announcements yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="flex min-w-0 cursor-pointer flex-col items-start rounded-2xl border border-gray-100 p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <CreatorBadge role={item.user?.role} />
                <span className="whitespace-nowrap text-sm font-semibold text-blue-600">
                  {formatDate(item.createdAt)}
                </span>
              </div>

              <h3 className="mt-3 line-clamp-1 w-full text-lg font-bold text-gray-900">
                {item.title}
              </h3>

              <p className="mt-2 line-clamp-2 w-full break-words text-sm leading-6 text-gray-600">
                {item.content}
              </p>

              <span className="mt-4 inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                {item.user?.fullName ?? "Anonymous"}
              </span>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 border-t border-slate-200 pt-3 text-sm">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={pageNumber <= 1 || isLoading}
            className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-gray-500">
            Page {pageNumber}/{totalPages}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={pageNumber >= totalPages || isLoading}
            className="inline-flex cursor-pointer items-center gap-1 text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

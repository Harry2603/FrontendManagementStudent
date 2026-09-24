import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAnnouncements } from "@/features/announcements/hooks/useAnnouncements";
import AnnouncementForm from "@/features/announcements/components/AnnouncementForm";
import AnnouncementList from "@/features/announcements/components/AnnouncementList";

export default function HomePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const { user } = useAuth();
  const {
    items,
    pageNumber,
    totalPages,
    isLoading,
    error,
    isSubmitting,
    nextPage,
    prevPage,
    createAnnouncement,
  } = useAnnouncements();

  const canCreate = user?.role === "TEACHER" || user?.role === "ADMIN";

  const visibleItems = items.filter((item) => {
    const creatorRole = item?.user?.role;

    if (!user?.role) return false;

    return (
      (user.role === "ADMIN" ||
        user.role === "TEACHER" ||
        user.role === "STUDENT") &&
      (creatorRole === "TEACHER" || creatorRole === "ADMIN")
    );
  });

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Xin chào, {user?.fullName ?? "bạn"}
        </h1>
        <p className="text-sm text-gray-500">{user?.role}</p>
      </div>

      {canCreate && (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tạo thông báo
        </button>
      )}

      {canCreate && isFormOpen && (
        <AnnouncementForm
          onCreate={createAnnouncement}
          isSubmitting={isSubmitting}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      <AnnouncementList
        items={visibleItems}
        pageNumber={pageNumber}
        totalPages={totalPages}
        isLoading={isLoading}
        error={error}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onSelect={setSelectedAnnouncement}
      />

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setSelectedAnnouncement(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="announcement-detail-title"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="announcement-detail-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {selectedAnnouncement.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedAnnouncement.user?.fullName ?? "Ẩn danh"} ·{" "}
                  {selectedAnnouncement.user?.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Đóng chi tiết thông báo"
                className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {selectedAnnouncement.content}
            </p>
            <p className="mt-5 text-xs text-gray-400">
              {new Date(selectedAnnouncement.createdAt).toLocaleString("vi-VN")}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

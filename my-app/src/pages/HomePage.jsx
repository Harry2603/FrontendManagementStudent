import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAnnouncements } from "@/features/announcements/hooks/useAnnouncements";
import AnnouncementForm from "@/features/announcements/components/AnnouncementForm";
import AnnouncementList from "@/features/announcements/components/AnnouncementList";

export default function HomePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
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
      />
    </div>
  );
}

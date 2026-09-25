import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAnnouncements } from "@/features/announcements/hooks/useAnnouncements";
import { courseSectionService } from "@/features/enrollment/services/courseSectionService";
import AnnouncementForm from "@/features/announcements/components/AnnouncementForm";
import AnnouncementList from "@/features/announcements/components/AnnouncementList";

export default function AnnouncementCenter() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [sections, setSections] = useState([]);
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

  useEffect(() => {
    if (user?.role !== "TEACHER") {
      return undefined;
    }

    let active = true;
    courseSectionService
      .getTeacherSections({ pageNumber: 1, pageSize: 100 })
      .then((response) => {
        if (active) setSections(response?.items ?? []);
      })
      .catch(() => {
        if (active) setSections([]);
      });

    return () => {
      active = false;
    };
  }, [user?.role]);

  const visibleItems = items.filter((item) => {
    const creatorRole = item?.user?.role;
    return creatorRole === "TEACHER" || creatorRole === "ADMIN";
  });

  return (
    <section className="w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Announcement Center
          </h1>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create announcement
          </button>
        )}
      </div>

      {canCreate && isFormOpen && (
        <AnnouncementForm
          onCreate={createAnnouncement}
          isSubmitting={isSubmitting}
          onClose={() => setIsFormOpen(false)}
          sections={user?.role === "TEACHER" ? sections : []}
          isTeacher={user?.role === "TEACHER"}
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
            className="max-h-[40vh] w-[600px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500">
                  {selectedAnnouncement.user?.fullName ?? "Anonymous"}
                  {selectedAnnouncement.user?.role && (
                    <span className="text-gray-400">
                      {" "}
                      · {selectedAnnouncement.user.role}
                    </span>
                  )}
                </p>
                <h2
                  id="announcement-detail-title"
                  className="mt-1 break-words text-xl font-bold text-gray-900"
                >
                  {selectedAnnouncement.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                aria-label="Close announcement details"
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-3 text-sm font-semibold text-blue-600">
              {new Date(selectedAnnouncement.createdAt).toLocaleString("en-GB")}
            </p>

            <p className="mt-5 break-words whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {selectedAnnouncement.content}
            </p>
          </section>
        </div>
      )}
    </section>
  );
}

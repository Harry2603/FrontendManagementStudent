import { useEffect, useState } from "react";
import { BookOpen, Check, LoaderCircle, X } from "lucide-react";
import { Table } from "@/components/ui/Table";
import PageLoader from "@/components/common/PageLoader";
import { courseSectionService } from "@/features/enrollment/services/courseSectionService";

const dayLabels = {
  MONDAY: "Thứ 2",
  TUESDAY: "Thứ 3",
  WEDNESDAY: "Thứ 4",
  THURSDAY: "Thứ 5",
  FRIDAY: "Thứ 6",
  SATURDAY: "Thứ 7",
  SUNDAY: "Chủ nhật",
};

const formatSection = (section) => ({
  ...section,
  sectionId: section.sectionId ?? section.id,
  code: section.sectionCode,
  name: `Môn học #${section.courseId}`,
  schedule: `${dayLabels[section.dayOfWeek] ?? section.dayOfWeek}, ${section.startPeriod} - ${section.endPeriod}`,
});

export default function EnrollmentPage() {
  const [activeTab, setActiveTab] = useState("available");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedSectionIds, setSelectedSectionIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [enrollmentResult, setEnrollmentResult] = useState(null);
  const tabs = [
    { id: "available", label: "Đăng ký học phần", icon: BookOpen },
    { id: "enrolled", label: "Môn học đã đăng ký", icon: Check },
  ];

  useEffect(() => {
    let ignore = false;

    async function fetchOpenSections() {
      setPageLoading(true);
      setPageError("");
      try {
        const response = await courseSectionService.getOpenSections();
        if (!ignore) {
          setAvailableCourses((response?.items ?? []).map(formatSection));
        }
      } catch (error) {
        if (!ignore) {
          setPageError(
            error?.response?.data?.message ||
              "Không tải được danh sách học phần, vui lòng thử lại",
          );
        }
      } finally {
        if (!ignore) setPageLoading(false);
      }
    }

    fetchOpenSections();
    return () => {
      ignore = true;
    };
  }, []);

  const courses = activeTab === "available" ? availableCourses : [];
  const toggleSection = (sectionId) => {
    setSelectedSectionIds((currentIds) =>
      currentIds.includes(sectionId)
        ? currentIds.filter((id) => id !== sectionId)
        : [...currentIds, sectionId],
    );
  };

  const submitEnrollment = async () => {
    if (selectedSectionIds.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const response = await courseSectionService.postEnrolls({
        enrollments: selectedSectionIds.map((sectionId) => ({ sectionId })),
      });
      setEnrollmentResult(response);
    } catch (error) {
      setEnrollmentResult({
        error:
          error?.response?.data?.message ||
          "Đăng ký học phần thất bại, vui lòng thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Mã lớp học phần",
      sortable: true,
      render: (course) => (
        <span className="font-semibold text-blue-600">{course.code}</span>
      ),
    },
    { key: "name", header: "Môn học", sortable: true },
    { key: "capacity", header: "Sĩ số tối đa", sortable: true },
    { key: "schedule", header: "Lịch học" },
    {
      key: "action",
      header: "Chọn",
      render: (course) =>
        activeTab === "available" ? (
          <input
            type="checkbox"
            checked={selectedSectionIds.includes(course.sectionId)}
            onChange={() => toggleSection(course.sectionId)}
            aria-label={`Chọn học phần ${course.code}`}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
            <Check size={17} />
            Đã đăng ký
          </span>
        ),
    },
  ];

  if (pageLoading) return <PageLoader />;

  if (pageError) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-white p-8 text-center shadow">
        <p role="alert" className="text-sm text-red-600">
          {pageError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Học tập
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Đăng ký học phần
        </h1>
        <p className="mt-2 text-slate-600">
          Quản lý các học phần trong học kỳ hiện tại.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <div
          className="flex gap-6 overflow-x-auto"
          role="tablist"
          aria-label="Enrollment views"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:border-blue-300 hover:text-blue-800"
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {activeTab === "available"
                ? "Danh sách học phần mở"
                : "Lịch học của bạn"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Học kỳ 1, năm học 2026 - 2027
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <button
              type="button"
              onClick={submitEnrollment}
              disabled={selectedSectionIds.length === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <LoaderCircle size={16} className="animate-spin" />}
              Đăng ký
            </button>
          </div>
        </div>

        <div role="tabpanel">
          <Table
            columns={columns}
            data={courses}
            rowKey={(course) => course.sectionId}
            emptyMessage="Chưa có học phần"
          />
        </div>
      </div>

      {enrollmentResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEnrollmentResult(null);
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-result-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="enrollment-result-title" className="text-xl font-bold text-slate-900">
                  Kết quả đăng ký
                </h2>
                {enrollmentResult.error ? (
                  <p className="mt-2 text-sm text-red-600">{enrollmentResult.error}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">
                    Thành công: {enrollmentResult.successCount ?? 0} · Thất bại: {enrollmentResult.failedCount ?? 0}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEnrollmentResult(null)}
                aria-label="Đóng kết quả đăng ký"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {enrollmentResult.results?.length > 0 && (
              <div className="mt-5 space-y-3">
                {enrollmentResult.results.map((result, index) => {
                  const isSuccess = result.status?.toLowerCase() === "success";
                  return (
                    <div
                      key={`${result.sectionId}-${index}`}
                      className={`rounded-lg border p-4 ${
                        isSuccess
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <p className={`font-semibold ${isSuccess ? "text-emerald-700" : "text-red-700"}`}>
                        Học phần {result.sectionId}: {isSuccess ? "Đăng ký thành công" : "Đăng ký thất bại"}
                      </p>
                      {!isSuccess && result.reason && (
                        <p className="mt-1 text-sm text-red-600">{result.reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setEnrollmentResult(null)}
              className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, Check } from "lucide-react";
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
  code: section.sectionCode,
  name: `Môn học #${section.courseId}`,
  schedule: `${dayLabels[section.dayOfWeek] ?? section.dayOfWeek}, ${section.startPeriod} - ${section.endPeriod}`,
});

export default function EnrollmentPage() {
  const [activeTab, setActiveTab] = useState("available");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
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
  const columns = [
    {
      key: "code",
      header: "Mã lớp học phần",
      sortable: true,
      render: (course) => (
        <span className="font-semibold text-indigo-700">{course.code}</span>
      ),
    },
    { key: "name", header: "Môn học", sortable: true },
    { key: "capacity", header: "Sĩ số tối đa", sortable: true },
    { key: "schedule", header: "Lịch học" },
    {
      key: "action",
      header: "Trạng thái",
      render: () =>
        activeTab === "available" ? (
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Đăng ký
          </button>
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
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
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
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
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
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <CalendarDays size={17} />
            {courses.length} học phần
          </div>
        </div>

        <div role="tabpanel">
          <Table
            columns={columns}
            data={courses}
            rowKey={(course) => course.code}
            emptyMessage="Chưa có học phần"
          />
        </div>
      </div>
    </section>
  );
}
